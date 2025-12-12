-- Ensure inventory upserts work (required for onConflict in app code)
-- Run this once in Supabase SQL editor or via psql.

-- Unique by source_url (canonical product URL)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'inventory_source_url_key'
  ) then
    create unique index inventory_source_url_key on public.inventory (source_url);
  end if;
end$$;

-- Optional: also dedupe by affiliate_url if present
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'inventory_affiliate_url_key'
  ) then
    create unique index inventory_affiliate_url_key on public.inventory (affiliate_url);
  end if;
end$$;
