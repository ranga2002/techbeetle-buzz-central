/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ApifyClient } from "https://esm.sh/apify-client@2.9.1?target=deno";

type ScrapedProduct = {
  title?: string;
  name?: string;
  description?: string;
  body?: string;
  images?: string[];
  image?: string;
  price?: number | string;
  rating?: number | string;
  brand?: string;
  model?: string;
  sku?: string;
  availability?: string;
  availability_status?: string;
};

type JsonObject = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as JsonObject;
    const product_url =
      typeof body.product_url === "string"
        ? body.product_url
        : typeof body.url === "string"
          ? body.url
          : "";
    const maxPagesRaw = typeof body.maxPages === "number" ? body.maxPages : 2;
    const maxItemsRaw = typeof body.maxItems === "number" ? body.maxItems : 20;
    const maxPages = Math.max(1, Math.min(maxPagesRaw, 3)); // keep small to avoid long runs
    const maxItems = Math.max(1, Math.min(maxItemsRaw, 50));

    if (!product_url) {
      return jsonResponse({ error: "product_url (or url) is required" }, 400);
    }

    const token = Deno.env.get("APIFY_TOKEN");
    if (!token) {
      return jsonResponse({ error: "APIFY_TOKEN is not set" }, 500);
    }

    // Resolve short URLs (amzn.to, amzn.in, etc.) to the final destination
    const resolvedUrl = await resolveRedirect(product_url);

    // Try Apify first; on failure fall back to internal scraper
    try {
      const client = new ApifyClient({ token });
      const input = {
        categoryUrls: [{ url: resolvedUrl }],
        maxItemsPerStartUrl: maxItems,
        maxSearchPagesPerStartUrl: maxPages,
        maxProductVariantsAsSeparateResults: 0,
        useCaptchaSolver: false,
        scrapeProductVariantPrices: false,
        scrapeProductDetails: true,
        ensureLoadedProductDescriptionFields: false,
      };

      const run = await client.actor("XVDTQc4a7MDTqSTMJ").call({ input, waitSecs: 25 });
      const status = run.status ?? run.data?.status;
      const datasetId = run.defaultDatasetId ?? run.data?.defaultDatasetId;
      if (status !== "SUCCEEDED") throw new Error(`Apify run did not finish in time (status=${status})`);
      if (!datasetId) throw new Error("Apify run missing defaultDatasetId");

      const { items } = await client.dataset(datasetId).listItems({ limit: maxItems });
      if (!items || items.length === 0) {
        throw new Error("No products returned from Apify scraper");
      }

      const first = items[0] as ScrapedProduct | undefined;
      if (!first) {
        throw new Error("Apify dataset missing product details");
      }
      const product = {
        title: first.title || first.name || "",
        description: first.description || first.body || "",
        images: first.images || (first.image ? [first.image] : []),
        price: Number(first.price) || 0,
        rating: first.rating,
        brand: first.brand,
        model: first.model || first.sku,
        availability: first.availability || first.availability_status,
        source: resolvedUrl,
      };

      return jsonResponse({ success: true, product, raw: items });
    } catch (apifyError) {
      console.error("Apify scrape failed, falling back:", apifyError);
      // Fall back to existing scrape-product-data function
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      if (!serviceKey || !supabaseUrl) {
        return jsonResponse({ error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL env vars" }, 500);
      }

      const upstream = await fetch(`${supabaseUrl}/functions/v1/scrape-product-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ productUrl: product_url }),
      });

      const text = await upstream.text();
      const fallbackResult = safeJson(text);
      if (!upstream.ok) {
        const fallbackError =
          fallbackResult && typeof fallbackResult === "object"
            ? fallbackResult as { error?: unknown; message?: unknown }
            : null;
        const errorMessage =
          (fallbackError?.error as string | undefined) ||
          (fallbackError?.message as string | undefined) ||
          `Upstream error ${upstream.status}`;
        return jsonResponse(
          {
            error: errorMessage,
            upstreamStatus: upstream.status,
            upstreamBody: text,
          },
          upstream.status,
        );
      }
      return jsonResponse(fallbackResult || { success: true, data: text });
    }
  } catch (error: unknown) {
    console.error("amazon-product-scraper error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function resolveRedirect(url: string): Promise<string> {
  if (!url) return url;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res?.url) return res.url;
  } catch (e) {
    console.error("Redirect resolve failed", e);
  }
  return url;
}

function safeJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
