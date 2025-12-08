import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_url, apiKey } = await req.json();
    if (!product_url) {
      return jsonResponse({ error: "product_url is required" }, 400);
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceKey || !supabaseUrl) {
      return jsonResponse({ error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL env vars" }, 500);
    }

    // Proxy to existing scrape-product-data function to avoid code duplication
    const upstream = await fetch(`${supabaseUrl}/functions/v1/scrape-product-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey || serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ productUrl: product_url }),
    });

    const text = await upstream.text();
    const result = safeJson(text);

    if (!upstream.ok) {
      return jsonResponse(
        {
          error: result?.error || result?.message || `Upstream error ${upstream.status}`,
          upstreamStatus: upstream.status,
          upstreamBody: text,
        },
        upstream.status,
      );
    }

    return jsonResponse(result, 200);
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

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
