/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProductInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  affiliate_url?: string;
  source_url?: string;
  price?: number;
  images?: string[];
  specs?: Record<string, unknown>;
  brand?: string;
  model?: string;
  category_id?: string;
  author_id?: string;
  status?: "draft" | "published";
  provider?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  reading_time?: number;
  is_featured?: boolean;
  published_at?: string;
  inventory_id?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, serviceKey);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

const ensureInventory = async (body: ProductInput) => {
  if (!body.title) throw new Error("title is required for inventory");

  // If an inventory_id was provided, update that row.
  if (body.inventory_id) {
    const { data, error } = await supabase
      .from("inventory")
      .update({
        title: body.title,
        brand: body.brand,
        model: body.model,
        affiliate_url: body.affiliate_url,
        source_url: body.source_url || body.affiliate_url,
        price: body.price ?? null,
        images: body.images ?? [],
        specs: body.specs ?? null,
        availability: null,
        author_id: body.author_id,
      })
      .eq("id", body.inventory_id)
      .select("id")
      .single();

    if (error) throw error;
    return data?.id || body.inventory_id;
  }

  // Try to find an existing inventory row by source_url or affiliate_url.
  let existingId: string | null = null;
  const lookupUrl = body.source_url || body.affiliate_url;
  if (lookupUrl) {
    const { data, error } = await supabase
      .from("inventory")
      .select("id")
      .or(`source_url.eq.${lookupUrl},affiliate_url.eq.${lookupUrl}`)
      .limit(1)
      .single();
    if (!error && data?.id) {
      existingId = data.id;
    }
  }

  if (existingId) {
    const { data, error } = await supabase
      .from("inventory")
      .update({
        title: body.title,
        brand: body.brand,
        model: body.model,
        affiliate_url: body.affiliate_url,
        source_url: body.source_url || body.affiliate_url,
        price: body.price ?? null,
        images: body.images ?? [],
        specs: body.specs ?? null,
        availability: null,
        author_id: body.author_id,
      })
      .eq("id", existingId)
      .select("id")
      .single();
    if (error) throw error;
    return data?.id || existingId;
  }

  // Insert new inventory row.
  const { data, error } = await supabase
    .from("inventory")
    .insert({
      title: body.title,
      brand: body.brand,
      model: body.model,
      affiliate_url: body.affiliate_url,
      source_url: body.source_url || body.affiliate_url,
      price: body.price ?? null,
      images: body.images ?? [],
      specs: body.specs ?? null,
      availability: null,
      author_id: body.author_id,
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error("Failed to create inventory row");
  return data.id;
};

const upsertContent = async (body: ProductInput, inventoryId: string) => {
  const title = body.title || "Product";
  const slug = body.slug || toSlug(title);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("content")
    .upsert(
      {
        title,
        slug,
        excerpt: body.excerpt || body.content || "",
        content: body.content || body.excerpt || "",
        featured_image: body.featured_image || (body.images && body.images[0]) || null,
        content_type: "product",
        status: body.status || "published",
        author_id: body.author_id,
        category_id: body.category_id,
        inventory_id: inventoryId,
        provider: body.provider || "amazon",
        meta_title: body.meta_title || title,
        meta_description: body.meta_description || body.excerpt || title,
        is_featured: body.is_featured ?? false,
        is_indexable: false,
        reading_time: body.reading_time ?? 5,
        published_at: body.published_at || now,
        source_name: body.provider || null,
        updated_at: now,
      },
      { onConflict: "slug" },
    )
    .select("id, slug, inventory_id")
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error("Failed to upsert content row");
  return data;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as ProductInput;

    if (!body.title) {
      return jsonResponse({ error: "title is required" }, 400);
    }
    if (!body.author_id) {
      return jsonResponse({ error: "author_id is required" }, 400);
    }
    if (!body.category_id) {
      return jsonResponse({ error: "category_id is required" }, 400);
    }

    const inventoryId = await ensureInventory(body);
    const content = await upsertContent(body, inventoryId);

    return jsonResponse({
      success: true,
      content_id: content.id,
      slug: content.slug,
      inventory_id: inventoryId,
    });
  } catch (error) {
    console.error("add-product error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
