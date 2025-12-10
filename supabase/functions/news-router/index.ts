import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-country",
};

// Simple in-memory cache (per cold start); use short TTL to avoid staleness.
const cache = new Map<string, { expiresAt: number; payload: any }>();
// Keep cache comfortably under the scheduler cadence (5 min). Set to 4 minutes.
const CACHE_TTL_MS = 4 * 60 * 1000;

const DEFAULT_QUERY_TERMS = "technology OR gadget OR smartphone OR laptop OR AI";

type NormalizedArticle = {
  id: string;
  title: string;
  summary: string;
  url: string;
  image?: string | null;
  published_at?: string | null;
  source_published_at?: string | null;
  source_name: string;
  source_country?: string | null;
  provider: string;
  why_it_matters?: string;
  takeaways?: string[];
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  content?: string;
  content_raw?: string;
  key_points?: string[];
  _ai_indexable?: boolean;
};

const safeEnv = (key: string) => Deno.env.get(key) ?? "";

const NEWS_DATA_KEY = safeEnv("NEWSDATA_API_KEY");
const GNEWS_KEY = safeEnv("GNEWS_API_KEY");
const MEDIASTACK_KEY = safeEnv("MEDIASTACK_API_KEY");
const GUARDIAN_KEY = safeEnv("GUARDIAN_API_KEY");
const OPEN_API = safeEnv("OPEN_API");

const supabaseUrl = safeEnv("SUPABASE_URL");
const supabaseServiceKey = safeEnv("SUPABASE_SERVICE_ROLE_KEY");
const defaultAuthorId = safeEnv("DEFAULT_AUTHOR_ID"); // Set to a valid profiles.id for attribution

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resolveAuthorId = async (): Promise<string | null> => {
  if (defaultAuthorId) return defaultAuthorId;

  // Prefer an existing admin/editor profile
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .in("role", ["admin", "editor"])
    .limit(1)
    .maybeSingle();
  if (adminProfile?.id) return adminProfile.id;

  // Fallback: any active profile
  const { data: anyProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (anyProfile?.id) return anyProfile.id;

  // Last resort: create a system user to own ingested news
  try {
    const email = "news-bot@techbeetle.local";
    const password = crypto.randomUUID();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data?.user) {
      console.error("Failed to create system news user", error);
      return null;
    }
    const systemId = data.user.id;
    await supabase.from("profiles").upsert({
      id: systemId,
      full_name: "TechBeetle News Bot",
      username: "news-bot",
      role: "admin",
      is_active: true,
    });
    return systemId;
  } catch (err) {
    console.error("Could not resolve or create author", err);
    return null;
  }
};

const purgeExistingNews = async () => {
  const { error } = await supabase.from("content").delete().eq("content_type", "news");
  if (error) {
    console.error("Failed to purge existing news", error);
    throw error;
  }
};

const parseCountry = (req: Request): string => {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("country");
  const fromHeader = req.headers.get("x-country");
  const country = (fromQuery || fromHeader || "us").toLowerCase();
  return country.length === 2 ? country : "us";
};

const toSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

type AiArticleOutput = {
  headline: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  summary: string;
  why_it_matters: string;
  key_points: string[];
  takeaways: string[];
  body: string;
  indexable: boolean;
};

const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch (_e) {
    return null;
  }
};

const fallbackExplainer = (article: NormalizedArticle): NormalizedArticle => {
  const ingestedAt = new Date().toISOString();
  const cleanSummary =
    (article.summary || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240) || "Brief update for TechBeetle readers.";

  const keyPointsBase = [
    cleanSummary,
    article.published_at ? `Published ${formatDate(article.published_at)}` : "Recent",
    `Source: ${article.source_name}`,
    article.source_country ? `Region: ${article.source_country.toUpperCase()}` : null,
  ].filter(Boolean) as string[];

  // Keep 2–4 concise bullets
  const keyPoints = keyPointsBase.slice(0, 4);

  const contentLines = [
    cleanSummary,
    `Originally reported by ${article.source_name}; this is a brief for TechBeetle readers.`,
    "Key points:",
    ...keyPoints.map((p) => `- ${p}`),
  ];

  return {
    ...article,
    source_published_at: article.published_at || null,
    published_at: ingestedAt,
    why_it_matters: article.why_it_matters || "Context: A quick take for TechBeetle readers.",
    takeaways: keyPoints,
    summary: cleanSummary,
    slug: article.slug || toSlug(article.title),
    seo_title: article.seo_title || `${article.title} | TechBeetle Brief`,
    seo_description: article.seo_description || cleanSummary.slice(0, 150),
    content: contentLines.join("\n\n"),
    key_points: keyPoints,
    _ai_indexable: false,
  };
};

const enhanceArticleWithAI = async (
  article: NormalizedArticle,
): Promise<NormalizedArticle> => {
  if (!OPEN_API) {
    return fallbackExplainer(article);
  }

  const systemPrompt =
    "You are a TechBeetle editor. Write original explainer articles, not paraphrases. " +
    "Use the provided content_raw/summary for facts; do NOT invent details. " +
    "Body: 8-12 sentences (~550-600 words) that cover the key facts, context, and implications. " +
    "Takeaways: 3–5 concise bullets. Tone: concise, neutral, helpful. " +
    "Return ONLY valid JSON for the fields described.";

  const userPayload = {
    title: article.title,
    summary: article.summary,
    content_raw: article.content_raw,
    source: article.source_name,
    published_at: article.published_at,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPEN_API}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.35,
        max_tokens: 1400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Create a TechBeetle explainer based on this source. Respond with JSON only.\n" +
              JSON.stringify(userPayload, null, 2),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI call failed", response.status, await response.text());
      return fallbackExplainer(article);
    }

    const json = await response.json();
    const content = typeof json?.choices?.[0]?.message?.content === "string"
      ? json.choices[0].message.content
      : "";
    const ai: AiArticleOutput | null = safeJsonParse<AiArticleOutput>(content);
    // Normalize minor key variations to keep ingestion resilient
    if (ai) {
      // Some model variants return `title` instead of `headline`
      ai.headline = ai.headline || (ai as any).title;
      // Accept `key_takeaways` as `takeaways`
      ai.takeaways = ai.takeaways || (ai as any).key_takeaways;
      // Normalize summary if present
      ai.summary = ai.summary || (ai as any).summary;
      // If body is missing, build one from what we have
      const fallbackSummary = ai.summary || article.summary || article.content_raw || "";
      const fallbackPoints =
        Array.isArray(ai.key_points) && ai.key_points.length > 0
          ? ai.key_points.join("\n- ")
          : Array.isArray(ai.takeaways) && ai.takeaways.length > 0
            ? ai.takeaways.join("\n- ")
            : "";
      ai.body = ai.body || fallbackSummary || fallbackPoints;
      // If the AI body is too short but we have source text, pad with source content
      if ((ai.body?.length || 0) < 400 && article.content_raw) {
        ai.body = `${ai.body ? ai.body + "\n\n" : ""}${article.content_raw.slice(0, 1200)}`;
      }
    }

    if (!ai || !ai.headline || !ai.body) {
      console.error("AI JSON parse failed", json);
      return fallbackExplainer(article);
    }

    const headline = ai.headline.trim();
    const slug = toSlug(ai.slug || ai.headline || article.title);
    const now = new Date().toISOString();

    return {
      ...article,
      title: headline,
      slug,
      summary: ai.summary?.trim() || article.summary,
      why_it_matters: ai.why_it_matters?.trim() || article.why_it_matters,
      takeaways: ai.takeaways && ai.takeaways.length > 0 ? ai.takeaways : ai.key_points || [],
      key_points: ai.key_points || [],
      seo_title: ai.seo_title?.slice(0, 120) || truncate(headline, 60),
      seo_description: ai.seo_description?.slice(0, 180) || truncate(ai.summary || headline, 155),
      content: ai.body,
      source_published_at: article.published_at || article.source_published_at || null,
      published_at: now,
      _ai_indexable: Boolean(ai.indexable),
    };
  } catch (error) {
    console.error("enhanceArticleWithAI error", error);
    return fallbackExplainer(article);
  }
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch (_e) {
    return value;
  }
};

const dedupe = (items: NormalizedArticle[]): NormalizedArticle[] => {
  const seen = new Set<string>();
  const result: NormalizedArticle[] = [];
  for (const item of items) {
    const slugKey = toSlug(item.slug || item.title || "");
    const urlKey = (item.url || item.id || "").toLowerCase();
    const key = urlKey || `${slugKey}|${(item.source_name || "").toLowerCase()}`;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const fetchNewsData = async (country: string, limit = 10, query?: string) => {
  if (!NEWS_DATA_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const url =
    `https://newsdata.io/api/1/news?apikey=${NEWS_DATA_KEY}` +
    `&category=technology&language=en&country=${country}` +
    `&q=${search}` +
    `&page=1`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  const items = (json.results || []).slice(0, limit);
  return items.map((item: any) => ({
    id: item.article_id || item.link,
    title: item.title,
    summary: item.description || item.content || "",
    url: item.link,
    image: item.image_url,
    published_at: item.pubDate,
    source_name: item.source_id || "NewsData",
    source_country: item.country?.[0] || country,
    provider: "newsdata",
    content_raw: item.content || item.description || "",
  })) as NormalizedArticle[];
};

const fetchGNews = async (country: string, limit = 10, query?: string) => {
  if (!GNEWS_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const base = query
    ? `https://gnews.io/api/v4/search?token=${GNEWS_KEY}&lang=en&country=${country}`
    : `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&topic=technology&lang=en&country=${country}`;
  const url = `${base}&max=${limit}&q=${search}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.articles || []).map((item: any) => ({
    id: item.url,
    title: item.title,
    summary: item.description || item.content || "",
    url: item.url,
    image: item.image,
    published_at: item.publishedAt,
    source_name: item.source?.name || "GNews",
    source_country: country,
    provider: "gnews",
    content_raw: item.content || item.description || "",
  })) as NormalizedArticle[];
};

const fetchMediaStack = async (country: string, limit = 10, query?: string) => {
  if (!MEDIASTACK_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const url =
    `http://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}` +
    `&categories=technology&countries=${country}&languages=en&limit=${limit}` +
    `&keywords=${search.replace(/%20/g, ",")}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.data || []).map((item: any) => ({
    id: item.url,
    title: item.title,
    summary: item.description || "",
    url: item.url,
    image: item.image,
    published_at: item.published_at,
    source_name: item.source || "mediastack",
    source_country: item.country || country,
    provider: "mediastack",
    content_raw: item.description || "",
  })) as NormalizedArticle[];
};

const fetchGuardian = async (limit = 10, query?: string) => {
  if (!GUARDIAN_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const url =
    `https://content.guardianapis.com/search?q=${search}&section=technology` +
    `&order-by=newest&show-fields=trailText,bodyText,thumbnail&api-key=${GUARDIAN_KEY}&page-size=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.response?.results || []).map((item: any) => ({
    id: item.id,
    title: item.webTitle,
    summary:
      item.fields?.trailText ||
      (item.fields?.bodyText ? item.fields.bodyText.slice(0, 300) : ""),
    url: item.webUrl,
    image: item.fields?.thumbnail,
    published_at: item.webPublicationDate,
    source_name: "The Guardian",
    source_country: "gb",
    provider: "guardian",
    content_raw: item.fields?.bodyText || item.fields?.trailText || "",
  })) as NormalizedArticle[];
};

const collectArticles = async (country: string, needed = 60, query?: string) => {
  const providers: Array<() => Promise<NormalizedArticle[]>> = [
    () => fetchNewsData(country, 10, query),
    () => fetchGNews(country, 10, query),
    () => fetchMediaStack(country, 10, query),
    () => fetchGuardian(10, query),
  ];

  const results: NormalizedArticle[] = [];
  for (const provider of providers) {
    try {
      const chunk = await provider();
      results.push(...chunk);
      if (results.length >= needed) break;
    } catch (err) {
      console.error("Provider failed", err);
    }
  }
  const sorted = dedupe(results)
    .map((item) => ({
      ...item,
      published_at: item.published_at || new Date().toISOString(),
    }))
    .sort((a, b) => {
      const aDate = new Date(a.published_at || "").getTime() || 0;
      const bDate = new Date(b.published_at || "").getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, needed);

  const enhanced = await Promise.all(sorted.map((item) => enhanceArticleWithAI(item)));
  return enhanced;
};

const truncate = (value: string, max = 200) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

const ensureCategory = async (slug: string, name: string) => {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Category lookup failed", error);
    return null;
  }
  if (data?.id) return data.id;

  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      is_active: true,
      description: "Auto-created by news-router",
      color: "#3B82F6",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Category insert failed", insertError);
    return null;
  }
  return created?.id ?? null;
};

const persistArticles = async (items: NormalizedArticle[], country: string) => {
  const authorId = await resolveAuthorId();
  if (!authorId) {
    console.warn("No author available; skipping persistence to content.");
    return;
  }

  // Migration reference (run separately):
  // alter table content add column if not exists is_indexable boolean not null default false;

  const regionSlug = `news-${country.toLowerCase()}`;
  const categoryId =
    (await ensureCategory(regionSlug, `News (${country.toUpperCase()})`)) ||
    (await ensureCategory("technology", "Technology"));

  for (const article of items) {
    try {
      const nowIso = new Date().toISOString();
      const isIndexable = article._ai_indexable ?? false;
      const insertPayload = {
        title: article.title,
        slug: article.slug || toSlug(article.title),
        excerpt: truncate(article.summary || "", 200),
        content: article.content || article.summary || "",
        why_it_matters: article.why_it_matters || null,
        takeaways: article.takeaways || article.key_points || null,
        key_points: article.key_points || null,
        featured_image: article.image ?? null,
        content_type: "news",
        status: "published",
        author_id: authorId,
        category_id: categoryId,
        published_at: article.published_at ?? new Date().toISOString(),
        meta_title: article.seo_title ?? truncate(article.title, 60),
        meta_description: article.seo_description ?? truncate(article.summary || article.title, 160),
        is_featured: false,
        is_indexable: isIndexable,
        reading_time: 5,
        views_count: 0,
        likes_count: 0,
        updated_at: nowIso,
        // created_at intentionally omitted on conflict to preserve original insertion time
      };

      const { data: upserted, error: upsertError } = await supabase
        .from("content")
        .upsert(insertPayload, { onConflict: "slug" })
        .select("id")
        .single();

      if (upsertError) {
        console.error("Content upsert failed", { slug: insertPayload.slug, upsertError });
        continue;
      }

      // Best-effort source metadata
      const contentId = upserted?.id;
      if (contentId) {
        const now = new Date().toISOString();
        const { error: sourceError } = await supabase.from("content_sources").upsert({
          content_id: contentId,
          source_url: article.url,
          source_name: article.source_name,
          source_type: article.provider,
          last_updated: now,
          scraped_at: now,
        });
        if (sourceError) {
          console.error("content_sources upsert failed", { slug: insertPayload.slug, sourceError });
        }
      }
    } catch (e) {
      console.error("Failed to persist article", article.slug, e);
    }
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional body and flags
  let body: any = null;
  let bypassCache = false;
  let purgeExisting = false;
  let query: string | undefined;
  try {
    body = await req.json();
    bypassCache = Boolean(body?.refresh || body?.bypass_cache || body?.triggered_at);
    purgeExisting = Boolean(body?.purge);
    query = typeof body?.query === "string" ? body.query.trim() : undefined;
  } catch (_e) {
    // no-op; body might be empty
  }
  if (req.headers.get("x-bypass-cache") === "true") {
    bypassCache = true;
  }

  const url = new URL(req.url);
  if (!query) {
    const qp = url.searchParams.get("q");
    query = qp ? qp.trim() : undefined;
  }
  if (query) {
    // Keep search responses fresh
    bypassCache = true;
  }

  const country = parseCountry(req);
  const cacheKey = query
    ? `news-${country}-${query.toLowerCase()}`
    : `news-${country}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (!bypassCache && cached && cached.expiresAt > now) {
    return new Response(JSON.stringify(cached.payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    if (purgeExisting) {
      await purgeExistingNews();
    }

    const items = await collectArticles(country, 20, query);

    // Persist to content table (best effort; will skip if DEFAULT_AUTHOR_ID is not configured)
    await persistArticles(items, country);

    // Optional: record pull usage (no-op if table missing)
    try {
      await supabase.from("ingestion_logs").insert({
        country,
        count: items.length,
        created_at: new Date().toISOString(),
        source: "news-router",
      });
    } catch (_e) {
      // ignore logging errors if table does not exist
    }

    const payload = {
      success: true,
      country,
      query: query || null,
      count: items.length,
      items,
      generated_at: new Date().toISOString(),
    };

    cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("news-router error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
