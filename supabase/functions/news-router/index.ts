import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-country",
};

// Simple in-memory cache (per cold start); use short TTL to avoid staleness.
const cache = new Map<string, { expiresAt: number; payload: any }>();
// Keep cache under the scheduled refresh cadence (10 min). Set to 9 minutes.
const CACHE_TTL_MS = 9 * 60 * 1000;

type NormalizedArticle = {
  id: string;
  title: string;
  summary: string;
  url: string;
  image?: string | null;
  published_at?: string | null;
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
};

const safeEnv = (key: string) => Deno.env.get(key) ?? "";

const NEWS_DATA_KEY = safeEnv("NEWSDATA_API_KEY");
const GNEWS_KEY = safeEnv("GNEWS_API_KEY");
const MEDIASTACK_KEY = safeEnv("MEDIASTACK_API_KEY");
const GUARDIAN_KEY = safeEnv("GUARDIAN_API_KEY");

const supabaseUrl = safeEnv("SUPABASE_URL");
const supabaseServiceKey = safeEnv("SUPABASE_SERVICE_ROLE_KEY");
const defaultAuthorId = safeEnv("DEFAULT_AUTHOR_ID"); // Set to a valid profiles.id for attribution

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

const rewriteArticle = (article: NormalizedArticle): NormalizedArticle => {
  const why = `Why it matters: ${article.title.slice(0, 90)}...`;
  const takeaways = [
    `Source: ${article.source_name}`,
    `Published: ${article.published_at || "recent"}`,
    `Region: ${article.source_country || "global"}`,
  ];
  const keyPoints = [
    `${article.title}`,
    `Published ${article.published_at ? formatDate(article.published_at) : "recently"}`,
    `From ${article.source_name}`,
  ];
  const seoTitle = `${article.title} | TechBeetle Brief`;
  const seoDescription =
    article.summary?.slice(0, 150) ||
    `Latest on ${article.source_name}: ${article.title}`;
  const synthesizedContent = [
    article.content_raw,
    article.summary || "",
    `Originally from ${article.source_name}${
      article.source_country ? ` (${article.source_country.toUpperCase()})` : ""
    }, curated for TechBeetle readers.`,
    "Key takeaways:",
    ...keyPoints.map((p) => `- ${p}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    ...article,
    why_it_matters: why,
    takeaways,
    summary:
      article.summary ||
      `A fresh update from ${article.source_name} on recent technology developments.`,
    slug: toSlug(article.title),
    seo_title: seoTitle,
    seo_description: seoDescription,
    content: synthesizedContent,
    key_points: keyPoints,
  };
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
    const key = `${item.title.toLowerCase()}|${item.source_name}|${item.published_at ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const fetchNewsData = async (country: string, limit = 10) => {
  if (!NEWS_DATA_KEY) return [] as NormalizedArticle[];
  const url =
    `https://newsdata.io/api/1/news?apikey=${NEWS_DATA_KEY}` +
    `&category=technology&language=en&country=${country}` +
    `&q=technology OR gadget OR smartphone OR laptop OR AI` +
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

const fetchGNews = async (country: string, limit = 10) => {
  if (!GNEWS_KEY) return [] as NormalizedArticle[];
  const url =
    `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}` +
    `&topic=technology&lang=en&country=${country}&max=${limit}` +
    `&q=technology+OR+gadget+OR+smartphone+OR+laptop+OR+AI`;
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

const fetchMediaStack = async (country: string, limit = 10) => {
  if (!MEDIASTACK_KEY) return [] as NormalizedArticle[];
  const url =
    `http://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}` +
    `&categories=technology&countries=${country}&languages=en&limit=${limit}` +
    `&keywords=technology,gadget,smartphone,laptop,ai`;
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

const fetchGuardian = async (limit = 10) => {
  if (!GUARDIAN_KEY) return [] as NormalizedArticle[];
  const url =
    `https://content.guardianapis.com/search?q=technology%20OR%20gadget%20OR%20smartphone%20OR%20laptop%20OR%20AI&section=technology` +
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

const collectArticles = async (country: string, needed = 20) => {
  const providers: Array<() => Promise<NormalizedArticle[]>> = [
    () => fetchNewsData(country, 10),
    () => fetchGNews(country, 10),
    () => fetchMediaStack(country, 10),
    () => fetchGuardian(10),
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
  return dedupe(results).slice(0, needed).map(rewriteArticle);
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
  if (!defaultAuthorId) {
    console.warn("DEFAULT_AUTHOR_ID is not set; skipping persistence to content.");
    return;
  }

  const regionSlug = `news-${country.toLowerCase()}`;
  const categoryId =
    (await ensureCategory(regionSlug, `News (${country.toUpperCase()})`)) ||
    (await ensureCategory("technology", "Technology"));

  for (const article of items) {
    try {
      const insertPayload = {
        title: article.title,
        slug: article.slug || toSlug(article.title),
        excerpt: truncate(article.summary || "", 200),
        content: article.content || article.summary || "",
        featured_image: article.image ?? null,
        content_type: "news",
        status: "published",
        author_id: defaultAuthorId,
        category_id: categoryId,
        published_at: article.published_at ?? new Date().toISOString(),
        meta_title: article.seo_title ?? truncate(article.title, 60),
        meta_description: article.seo_description ?? truncate(article.summary || article.title, 160),
        is_featured: false,
        reading_time: 5,
        views_count: 0,
        likes_count: 0,
      };

      const { error: upsertError } = await supabase
        .from("content")
        .upsert(insertPayload, { onConflict: "slug" });

      if (upsertError) {
        console.error("Content upsert failed", { slug: insertPayload.slug, upsertError });
        continue;
      }

      // Best-effort source metadata
      await supabase.from("content_sources").upsert({
        source_url: article.url,
        source_name: article.source_name,
        source_type: article.provider,
        last_updated: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      });
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
  try {
    body = await req.json();
    bypassCache = Boolean(body?.refresh || body?.bypass_cache || body?.triggered_at);
  } catch (_e) {
    // no-op; body might be empty
  }
  if (req.headers.get("x-bypass-cache") === "true") {
    bypassCache = true;
  }

  const country = parseCountry(req);
  const cacheKey = `news-${country}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (!bypassCache && cached && cached.expiresAt > now) {
    return new Response(JSON.stringify(cached.payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    const items = await collectArticles(country, 20);

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
