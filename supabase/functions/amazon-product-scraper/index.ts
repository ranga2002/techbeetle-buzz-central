import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ApifyClient } from "https://esm.sh/apify-client@2.9.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const product_url = body.product_url || body.url;
    const maxPages = Math.max(1, Math.min(body.maxPages ?? 2, 3)); // keep small to avoid long runs
    const maxItems = Math.max(1, Math.min(body.maxItems ?? 20, 50));

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
      const status = (run as any)?.status || (run as any)?.data?.status;
      const datasetId = (run as any)?.defaultDatasetId || (run as any)?.data?.defaultDatasetId;
      if (status !== "SUCCEEDED") throw new Error(`Apify run did not finish in time (status=${status})`);
      if (!datasetId) throw new Error("Apify run missing defaultDatasetId");

      const { items } = await client.dataset(datasetId).listItems({ limit: maxItems });
      if (!items || items.length === 0) {
        throw new Error("No products returned from Apify scraper");
      }

      const first: any = items[0];
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
        return jsonResponse(
          {
            error: fallbackResult?.error || fallbackResult?.message || `Upstream error ${upstream.status}`,
            upstreamStatus: upstream.status,
            upstreamBody: text,
          },
          upstream.status,
        );
      }
      return jsonResponse(fallbackResult || { success: true, data: text });
    }
  } catch (error: any) {
    console.error("amazon-product-scraper error", error);
    return jsonResponse({ error: error?.message || "Unknown error" }, 500);
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

function safeJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
