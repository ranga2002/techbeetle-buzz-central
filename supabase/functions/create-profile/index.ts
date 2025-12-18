import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceKey);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Missing Supabase env config" }, 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid user token" }, 401);
  }

  const user = userData.user;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : null;
  const username = typeof body.username === "string" ? body.username.trim() : null;

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: full_name || user.user_metadata?.full_name || null,
      username: username || user.user_metadata?.username || null,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    console.error("create-profile upsert error", upsertError);
    return jsonResponse({ error: upsertError.message }, 500);
  }

  return jsonResponse({ success: true });
});
