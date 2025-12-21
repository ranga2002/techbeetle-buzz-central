/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-country",
};

const categoryCache = new Map<string, string>();

// Simple in-memory cache (per cold start); use short TTL to avoid staleness.
const cache = new Map<string, { expiresAt: number; payload: unknown }>();
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

type CategoryRule = {
  slug: string;
  name: string;
  patterns: RegExp[];
};

type ProfileRow = { id: string };
type ContentSourceRow = { source_url?: string | null };
type ContentSlugRow = { slug?: string | null };

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

const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: "ai",
    name: "AI",
    patterns: [/(\b|[^a-z])ai(\b|[^a-z])/i, /artificial intelligence/i, /machine learning/i, /\bllm\b/i, /chatgpt/i, /openai/i, /generative ai/i],
  },
  {
    slug: "smartphones",
    name: "Smartphones",
    patterns: [/smartphone/i, /\biphone\b/i, /\bgalaxy\b/i, /\bpixel\b/i, /\boneplus\b/i, /\bphone\b/i],
  },
  {
    slug: "laptops",
    name: "Laptops",
    patterns: [/laptop/i, /notebook/i, /macbook/i, /chromebook/i, /surface (laptop|book)/i],
  },
  {
    slug: "tablets",
    name: "Tablets",
    patterns: [/tablet/i, /\bipad\b/i, /galaxy tab/i, /surface pro/i],
  },
  {
    slug: "wearables",
    name: "Wearables",
    patterns: [/wearable/i, /smartwatch/i, /fitness tracker/i, /fitbit/i, /apple watch/i, /garmin/i, /\bsmart ring\b/i],
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    patterns: [/smart home/i, /homekit/i, /matter\b/i, /alexa\b/i, /google home/i, /\bnest\b/i, /\bring\b/i, /homepod/i],
  },
  {
    slug: "audio",
    name: "Audio",
    patterns: [/audio\b/i, /soundbar/i, /speaker/i, /hi-?fi/i, /spotify/i, /podcast/i, /dolby/i, /sonos/i],
  },
  {
    slug: "headphones",
    name: "Headphones",
    patterns: [/headphone/i, /headset/i, /earbud/i, /earpod/i, /airpod/i, /\bbuds\b/i, /over-ear/i],
  },
  {
    slug: "gaming",
    name: "Gaming",
    patterns: [/gaming\b/i, /\bgame\b/i, /xbox/i, /playstation/i, /\bps\d/i, /nintendo/i, /switch\b/i, /steam deck/i, /esports/i],
  },
  {
    slug: "cameras",
    name: "Cameras",
    patterns: [/camera/i, /mirrorless/i, /dslr/i, /lens\b/i, /canon\b/i, /nikon\b/i, /sony alpha/i, /gopro/i],
  },
  {
    slug: "drones",
    name: "Drones",
    patterns: [/drone/i, /quadcopter/i, /\buav\b/i, /\bdji\b/i, /mavic/i],
  },
  {
    slug: "apps",
    name: "Apps",
    patterns: [/\bapp\b/i, /\bapps\b/i, /app store/i, /play store/i],
  },
  {
    slug: "mobile",
    name: "Mobile",
    patterns: [/\bmobile\b/i, /\b5g\b/i, /carrier/i, /verizon/i, /t-mobile/i, /at&t/i],
  },
  {
    slug: "startups",
    name: "Startups",
    patterns: [/startup/i, /seed round/i, /series [abc]/i, /funding/i, /venture/i, /\bvc\b/i],
  },
  {
    slug: "reviews",
    name: "Reviews",
    patterns: [/review\b/i, /hands[- ]on/i, /first look/i],
  },
  {
    slug: "gadgets",
    name: "Gadgets",
    patterns: [/gadget/i, /device\b/i, /hardware/i, /gizmo/i],
  },
];

const resolveAuthorId = async (): Promise<string | null> => {
  if (defaultAuthorId) return defaultAuthorId;

  // Prefer an existing admin/editor profile
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .in("role", ["admin", "editor"])
    .limit(1)
    .maybeSingle() as { data: ProfileRow | null };
  if (adminProfile?.id) return adminProfile.id;

  // Fallback: any active profile
  const { data: anyProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle() as { data: ProfileRow | null };
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

const extractClientIp = (req: Request): string | null => {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0].trim();
  return ip || null;
};

const geoLookupCountry = async (ip: string | null): Promise<string | null> => {
  if (!ip) return null;
  try {
    const resp = await fetch(`https://api.country.is/${ip}`);
    if (!resp.ok) return null;
    const json = await resp.json();
    const c = typeof json?.country === "string" ? json.country.toLowerCase() : null;
    return c && c.length === 2 ? c : null;
  } catch (_e) {
    return null;
  }
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
    "You are a Tech Beetle editor. Write original explainer articles, not paraphrases. " +
    "Use the provided content_raw/summary for facts; do NOT invent details. " +
    "Body: 8-12 sentences (~550-600 words) that cover the key facts, context, and implications. " +
    "Takeaways: 3-5 concise bullets. Tone: concise, neutral, helpful. " +
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

    const parsed = safeJsonParse<unknown>(content);
    const ai = parsed && typeof parsed === "object"
      ? (parsed as Partial<AiArticleOutput> & Record<string, unknown>)
      : null;

    if (ai) {
      const headlineVariant = typeof ai.title === "string" ? ai.title : undefined;
      const keyTakeawaysVariant = Array.isArray(ai["key_takeaways"])
        ? (ai["key_takeaways"] as string[])
        : undefined;
      ai.headline = ai.headline || headlineVariant;
      ai.takeaways = ai.takeaways || keyTakeawaysVariant;
      ai.summary = ai.summary || (typeof ai.summary === "string" ? ai.summary : undefined);

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

const toStringOrEmpty = (value: unknown): string => (typeof value === "string" ? value : "");
const toStringOrNull = (value: unknown): string | null => (typeof value === "string" ? value : null);

const normalizeUrl = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    url.hash = "";
    const params = new URLSearchParams(url.search);
    for (const key of Array.from(params.keys())) {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm") || lower === "ref" || lower === "source") {
        params.delete(key);
      }
    }
    url.search = params.toString();
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch (_e) {
    return trimmed.replace(/\/$/, "").toLowerCase();
  }
};

const normalizeTitle = (value?: string | null): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getDateKey = (value?: string | null): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

// Cache city -> country lookups to avoid repeated geocode calls per cold start.
const cityCountryCache = new Map<string, string>();

const resolveCountryFromCity = async (city: string): Promise<string | null> => {
  const key = city.toLowerCase().trim();
  if (!key) return null;
  if (cityCountryCache.has(key)) return cityCountryCache.get(key) ?? null;
  try {
    // Lightweight, keyless geocode endpoint. We only need country_code.
    const resp = await fetch(
      `https://geocode.maps.co/search?format=json&limit=1&q=${encodeURIComponent(city)}`,
    );
    if (!resp.ok) return null;
    const json = await resp.json();
    const first = Array.isArray(json) && json.length ? json[0] : null;
    const addr = first?.address as Record<string, unknown> | undefined;
    const cc = addr && typeof addr["country_code"] === "string" ? addr["country_code"] : null;
    const code = cc && cc.length === 2 ? cc.toLowerCase() : null;
    if (code) cityCountryCache.set(key, code);
    return code;
  } catch (_e) {
    return null;
  }
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "in",
  "on",
  "for",
  "to",
  "with",
  "at",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "as",
  "that",
  "this",
  "it",
  "its",
  "about",
]);

const tokenize = (value?: string | null): string[] => {
  if (!value) return [];
  return normalizeTitle(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
};

const jaccard = (aTokens: string[], bTokens: string[]): number => {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const dedupe = (items: NormalizedArticle[]): NormalizedArticle[] => {
  const seenUrl = new Set<string>();
  const seenSlug = new Set<string>();
  const seenTitleDay = new Set<string>();
  const seenTitleNoDate = new Set<string>();

  const fingerprints: Array<{
    titleTokens: string[];
    summaryTokens: string[];
    dateKey: string;
  }> = [];

  const result: NormalizedArticle[] = [];

  for (const item of items) {
    const slugKey = toSlug(item.slug || item.title || "");
    const urlKey = normalizeUrl(item.url || item.id || "");
    const titleKey = normalizeTitle(item.title);
    const dateKey = getDateKey(item.published_at || item.source_published_at || null);
    const titleDayKey = titleKey && dateKey ? `${titleKey}:${dateKey}` : "";

    if (urlKey && seenUrl.has(urlKey)) continue;
    if (slugKey && seenSlug.has(slugKey)) continue;
    if (titleDayKey && seenTitleDay.has(titleDayKey)) continue;
    if (!dateKey && titleKey && seenTitleNoDate.has(titleKey)) continue;

    // Fuzzy check against already-accepted items to catch AI rephrasing.
    const titleTokens = tokenize(item.title);
    const summaryTokens = tokenize(item.summary || item.content_raw || "");
    let isNearDuplicate = false;

    for (const fp of fingerprints) {
      const titleSim = jaccard(titleTokens, fp.titleTokens);
      const summarySim = jaccard(summaryTokens, fp.summaryTokens);
      const blended = Math.max(titleSim, (titleSim * 2 + summarySim) / 3);
      // Tight threshold to avoid over-merging; tuned for rephrased headlines.
      if (blended >= 0.88) {
        isNearDuplicate = true;
        break;
      }
      // If same day and moderately similar, also treat as duplicate.
      if (dateKey && dateKey === fp.dateKey && blended >= 0.82) {
        isNearDuplicate = true;
        break;
      }
    }
    if (isNearDuplicate) continue;

    if (urlKey) seenUrl.add(urlKey);
    if (slugKey) seenSlug.add(slugKey);
    if (titleDayKey) {
      seenTitleDay.add(titleDayKey);
    } else if (titleKey) {
      seenTitleNoDate.add(titleKey);
    }

    fingerprints.push({ titleTokens, summaryTokens, dateKey });
    result.push(item);
  }

  return result;
};

const fetchExistingArticleKeys = async (urls: string[], slugs: string[]) => {
  const existingUrls = new Set<string>();
  const existingSlugs = new Set<string>();

  if (urls.length > 0) {
    // Expand lookup to include normalized URLs so differences in tracking params don't slip through.
    const normalizedUrls = urls.map((u) => normalizeUrl(u)).filter(Boolean);
    const urlLookup = Array.from(new Set([...urls, ...normalizedUrls]));

    const { data, error } = await supabase
      .from("content_sources")
      .select("source_url")
      .in("source_url", urlLookup);
    if (error) {
      console.error("Existing source lookup failed", error);
    } else {
      for (const row of (data as ContentSourceRow[] | null) || []) {
        const key = normalizeUrl(row?.source_url);
        if (key) existingUrls.add(key);
      }
    }
  }

  if (slugs.length > 0) {
    const { data, error } = await supabase
      .from("content")
      .select("slug")
      .in("slug", slugs);
    if (error) {
      console.error("Existing slug lookup failed", error);
    } else {
      for (const row of (data as ContentSlugRow[] | null) || []) {
        const key = toSlug(row?.slug || "");
        if (key) existingSlugs.add(key);
      }
    }
  }

  return { existingUrls, existingSlugs };
};

const filterExistingArticles = async (items: NormalizedArticle[]) => {
  const urlLookup = new Set<string>();
  for (const item of items) {
    const raw = (item.url || "").trim();
    const normalized = normalizeUrl(item.url);
    if (raw) urlLookup.add(raw);
    if (normalized) urlLookup.add(normalized);
  }
  const urlKeys = Array.from(urlLookup);
  const slugKeys = Array.from(
    new Set(items.map((item) => toSlug(item.slug || item.title || "")).filter(Boolean)),
  );

  if (urlKeys.length === 0 && slugKeys.length === 0) return items;

  try {
    const { existingUrls, existingSlugs } = await fetchExistingArticleKeys(urlKeys, slugKeys);
    return items.filter((item) => {
      const urlKey = normalizeUrl(item.url) || (item.url || "").trim();
      const slugKey = toSlug(item.slug || item.title || "");
      if (urlKey && existingUrls.has(urlKey)) return false;
      if (slugKey && existingSlugs.has(slugKey)) return false;
      return true;
    });
  } catch (err) {
    console.error("Failed to filter existing articles", err);
    return items;
  }
};

const fetchNewsData = async (country: string, limit = 10, query?: string, page = 1) => {
  if (!NEWS_DATA_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const url =
    `https://newsdata.io/api/1/news?apikey=${NEWS_DATA_KEY}` +
    `&category=technology&language=en&country=${country}` +
    `&q=${search}` +
    `&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  const items = (json.results || []).slice(0, limit);
  return items.map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    const link = toStringOrEmpty(obj.link);
    const articleId = toStringOrEmpty(obj.article_id) || link;
    const summary = toStringOrEmpty(obj.description) || toStringOrEmpty(obj.content);
    const sourceCountry =
      Array.isArray(obj.country) && obj.country.length > 0
        ? toStringOrEmpty((obj.country as unknown[])[0])
        : country;
    return {
      id: articleId,
      title: toStringOrEmpty(obj.title),
      summary,
      url: link,
      image: toStringOrNull(obj.image_url),
      published_at: toStringOrNull(obj.pubDate),
      source_name: toStringOrEmpty(obj.source_id) || "NewsData",
      source_country: sourceCountry,
      provider: "newsdata",
      content_raw: toStringOrEmpty(obj.content) || toStringOrEmpty(obj.description),
    };
  }) as NormalizedArticle[];
};

const fetchGNews = async (country: string, limit = 10, query?: string, page = 1) => {
  if (!GNEWS_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const base = query
    ? `https://gnews.io/api/v4/search?token=${GNEWS_KEY}&lang=en&country=${country}`
    : `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&topic=technology&lang=en&country=${country}`;
  const url = `${base}&max=${limit}&page=${page}&q=${search}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.articles || []).map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    const link = toStringOrEmpty(obj.url);
    const source = obj.source as Record<string, unknown> | undefined;
    return {
      id: link,
      title: toStringOrEmpty(obj.title),
      summary: toStringOrEmpty(obj.description) || toStringOrEmpty(obj.content),
      url: link,
      image: toStringOrNull(obj.image),
      published_at: toStringOrNull(obj.publishedAt),
      source_name: source ? toStringOrEmpty(source.name) : "GNews",
      source_country: country,
      provider: "gnews",
      content_raw: toStringOrEmpty(obj.content) || toStringOrEmpty(obj.description),
    };
  }) as NormalizedArticle[];
};

const fetchMediaStack = async (country: string, limit = 10, query?: string, page = 1) => {
  if (!MEDIASTACK_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const offset = (Math.max(page, 1) - 1) * limit;
  const url =
    `http://api.mediastack.com/v1/news?access_key=${MEDIASTACK_KEY}` +
    `&categories=technology&countries=${country}&languages=en&limit=${limit}` +
    `&offset=${offset}` +
    `&keywords=${search.replace(/%20/g, ",")}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.data || []).map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    return {
      id: toStringOrEmpty(obj.url),
      title: toStringOrEmpty(obj.title),
      summary: toStringOrEmpty(obj.description),
      url: toStringOrEmpty(obj.url),
      image: toStringOrNull(obj.image),
      published_at: toStringOrNull(obj.published_at),
      source_name: toStringOrEmpty(obj.source) || "mediastack",
      source_country: toStringOrEmpty(obj.country) || country,
      provider: "mediastack",
      content_raw: toStringOrEmpty(obj.description),
    };
  }) as NormalizedArticle[];
};

const fetchGuardian = async (limit = 10, query?: string, page = 1) => {
  if (!GUARDIAN_KEY) return [] as NormalizedArticle[];
  const search = encodeURIComponent(query || DEFAULT_QUERY_TERMS);
  const url =
    `https://content.guardianapis.com/search?q=${search}&section=technology` +
    `&order-by=newest&show-fields=trailText,bodyText,thumbnail&api-key=${GUARDIAN_KEY}&page-size=${limit}&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.response?.results || []).map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    const fields = obj.fields as Record<string, unknown> | undefined;
    const bodyText = toStringOrEmpty(fields?.bodyText);
    const trailText = toStringOrEmpty(fields?.trailText);
    return {
      id: toStringOrEmpty(obj.id),
      title: toStringOrEmpty(obj.webTitle),
      summary: trailText || (bodyText ? bodyText.slice(0, 300) : ""),
      url: toStringOrEmpty(obj.webUrl),
      image: toStringOrNull(fields?.thumbnail),
      published_at: toStringOrNull(obj.webPublicationDate),
      source_name: "The Guardian",
      source_country: "gb",
      provider: "guardian",
      content_raw: bodyText || trailText,
    };
  }) as NormalizedArticle[];
};

const collectArticles = async (country: string, needed = 60, query?: string, page = 1) => {
  const providers: Array<() => Promise<NormalizedArticle[]>> = [
    () => fetchNewsData(country, 10, query, page),
    () => fetchGNews(country, 10, query, page),
    () => fetchMediaStack(country, 10, query, page),
    () => fetchGuardian(10, query, page),
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
      source_country: item.source_country || country,
    }))
    .sort((a, b) => {
      const aDate = new Date(a.published_at || "").getTime() || 0;
      const bDate = new Date(b.published_at || "").getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, needed);

  const fresh = await filterExistingArticles(sorted);
  const skippedExisting = sorted.length - fresh.length;

  const enhanced = await Promise.all(fresh.map((item) => enhanceArticleWithAI(item)));
  return { items: enhanced, skippedExisting };
};

const truncate = (value: string, max = 200) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

const ensureCategory = async (slug: string, name: string) => {
  const cached = categoryCache.get(slug);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Category lookup failed", error);
    return null;
  }
  if (data?.id) {
    categoryCache.set(slug, data.id);
    return data.id;
  }

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
  if (created?.id) {
    categoryCache.set(slug, created.id);
  }
  return created?.id ?? null;
};

const detectCategoryForArticle = (article: NormalizedArticle, country: string): { slug: string; name: string } => {
  const haystack = `${article.title} ${article.summary || ""} ${article.content_raw || ""} ${article.provider || ""} ${article.source_name || ""}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) {
      return { slug: rule.slug, name: rule.name };
    }
  }

  const region = (country || "us").toLowerCase();
  if (region) {
    return { slug: `news-${region}`, name: `News (${region.toUpperCase()})` };
  }
  return { slug: "technology", name: "Technology" };
};

const resolveCategoryForArticle = async (
  article: NormalizedArticle,
  country: string,
): Promise<{ id: string | null; slug: string }> => {
  const match = detectCategoryForArticle(article, country);
  const categoryId = await ensureCategory(match.slug, match.name);
  if (categoryId) {
    return { id: categoryId, slug: match.slug };
  }
  const fallbackId = await ensureCategory("technology", "Technology");
  return { id: fallbackId, slug: "technology" };
};

const buildSearchQuery = (baseQuery: string | undefined, city: string | null) => {
  const q = baseQuery && baseQuery.length > 0 ? baseQuery : DEFAULT_QUERY_TERMS;
  return city ? `${q} AND (${city})` : q;
};

const OTHER_COUNTRIES_POOL = ["us", "gb", "in", "au", "ca", "de", "fr", "jp"];

const persistArticles = async (items: NormalizedArticle[], country: string) => {
  const authorId = await resolveAuthorId();
  if (!authorId) {
    console.warn("No author available; skipping persistence to content.");
    return;
  }

  for (const article of items) {
    try {
      const category = await resolveCategoryForArticle(article, country);
      const nowIso = new Date().toISOString();
      const isIndexable = article._ai_indexable ?? false;
      const normalizedUrl = normalizeUrl(article.url);
      const insertPayload = {
        title: article.title,
        slug: article.slug || toSlug(article.title),
        excerpt: truncate(article.summary || "", 200),
        content: article.content || article.summary || "",
        provider: article.provider || null,
        why_it_matters: article.why_it_matters || null,
        takeaways: article.takeaways || article.key_points || null,
        key_points: article.key_points || null,
        featured_image: article.image ?? null,
        content_type: "news",
        status: "published",
        author_id: authorId,
        category_id: category?.id ?? null,
        published_at: article.published_at ?? new Date().toISOString(),
        source_name: article.source_name || null,
        source_country: article.source_country || country || null,
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
          source_url: normalizedUrl || article.url,
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
  let body: Record<string, unknown> | null = null;
  let bypassCache = false;
  let purgeExisting = false;
  let query: string | undefined;
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
      bypassCache = Boolean(
        body.refresh || body.bypass_cache || body.triggered_at,
      );
      purgeExisting = Boolean(body.purge);
      query = typeof body.query === "string" ? body.query.trim() : undefined;
    }
  } catch (_e) {
    // no-op; body might be empty
  }
  if (req.headers.get("x-bypass-cache") === "true") {
    bypassCache = true;
  }

  const url = new URL(req.url);
  const localCursor = Math.max(parseInt(url.searchParams.get("local_cursor") || "1", 10) || 1, 1);
  const otherCursor = Math.max(parseInt(url.searchParams.get("other_cursor") || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10) || 10, 1), 50);
  if (!query) {
    const qp = url.searchParams.get("q");
    query = qp ? qp.trim() : undefined;
  }
  if (query) {
    // Keep search responses fresh
    bypassCache = true;
  }

  const explicitCountry = (url.searchParams.get("country") || req.headers.get("x-country") || "").toLowerCase();
  const city = (url.searchParams.get("city") || "").trim() || null;
  const clientIp = extractClientIp(req);
  const geoCountry = explicitCountry ? null : await geoLookupCountry(clientIp);
  // If a city is provided, try to derive its country to improve relevance.
  const cityDerivedCountry = city ? await resolveCountryFromCity(city) : null;
  const country = (cityDerivedCountry || explicitCountry || geoCountry || "us").toLowerCase();

  const cacheKey = query
    ? `news-${country}-${city || "none"}-${query.toLowerCase()}-${localCursor}-${otherCursor}-${limit}`
    : `news-${country}-${city || "none"}-default-${localCursor}-${otherCursor}-${limit}`;
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

    const searchQuery = buildSearchQuery(query || undefined, city);

    // Local fetch
    const localRaw = await collectArticles(country, limit * 2, searchQuery, localCursor);

    // Other countries fetch
    const otherCountries = OTHER_COUNTRIES_POOL.filter((c) => c !== country);
    const otherRaw: NormalizedArticle[] = [];
    for (const c of otherCountries) {
      if (otherRaw.length >= limit * 2) break;
      const chunk = await collectArticles(c, limit, searchQuery, otherCursor);
      otherRaw.push(...chunk.items);
    }

    // Dedupe and filter against DB across combined
    const combined = dedupe([...localRaw.items, ...otherRaw]);
    const fresh = await filterExistingArticles(combined);
    const skippedExisting = combined.length - fresh.length;

    const localItems = fresh
      .filter((i) => (i.source_country || country).toLowerCase() === country)
      .sort((a, b) => (new Date(b.published_at || "").getTime() || 0) - (new Date(a.published_at || "").getTime() || 0))
      .slice(0, limit);

    const otherItems = fresh
      .filter((i) => (i.source_country || "").toLowerCase() !== country)
      .sort((a, b) => (new Date(b.published_at || "").getTime() || 0) - (new Date(a.published_at || "").getTime() || 0))
      .slice(0, limit);

    // Persist to content table (best effort; will skip if DEFAULT_AUTHOR_ID is not configured)
    await persistArticles([...localItems, ...otherItems], country);

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
      city,
      local: {
        items: localItems,
        next_cursor: localItems.length < limit ? null : String(localCursor + 1),
      },
      other: {
        items: otherItems,
        next_cursor: otherItems.length < limit ? null : String(otherCursor + 1),
      },
      skipped_existing: skippedExisting,
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
