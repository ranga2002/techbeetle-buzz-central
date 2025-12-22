import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.SITE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

if (!SITE_URL) {
  console.error('Missing SITE_URL env var (e.g. https://techbeetle.org).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type NewsRow = {
  slug: string;
  updated_at: string | null;
};

const toDate = (value?: string | null) => {
  if (!value) return new Date().toISOString().split('T')[0];
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

async function generate() {
  const { data, error } = await supabase
    .from('content')
    .select('slug, updated_at')
    .eq('content_type', 'news')
    .eq('is_indexable', true);

  if (error) {
    console.error('Supabase query failed', error);
    process.exit(1);
  }

  const urls = (data || [])
    .filter((row): row is NewsRow => Boolean(row?.slug))
    .map((row) => {
      const loc = `${SITE_URL.replace(/\/+$/, '')}/news/${row.slug}`;
      const lastmod = toDate(row.updated_at);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  const outPath = path.join(process.cwd(), 'public', 'news-sitemap.xml');
  await fs.writeFile(outPath, xml, 'utf8');
  console.log(`Wrote ${outPath} with ${data?.length ?? 0} URLs`);
}

generate();
