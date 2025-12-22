import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const requireEnv = (key, example) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing ${key} env var${example ? ` (e.g. ${example})` : ''}.`);
  }
  return value.trim();
};

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const SITE_URL = requireEnv('SITE_URL', 'https://techbeetle.org');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const toDate = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

// Map DB content types to path segments on the site
const PATH_MAP = {
  review: 'reviews',
  video: 'videos',
  how_to: 'how-to',
  comparison: 'compare',
  product: 'products', // included in case the enum was extended
  // news is intentionally omitted here; handled by news sitemap
};

const buildUrl = (base, type, slug) => `${base.replace(/\/+$/, '')}/${type}/${slug}`;

async function main() {
  const { data, error } = await supabase
    .from('content')
    .select('slug, updated_at, content_type, status, is_indexable');

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const entries = (data || [])
    .filter((row) => row?.slug && row?.content_type && row.status === 'published' && row.is_indexable)
    .filter((row) => PATH_MAP[row.content_type]) // only include mapped types
    .map((row) => {
      const loc = buildUrl(SITE_URL, PATH_MAP[row.content_type], row.slug);
      const lastmod = toDate(row.updated_at);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
    '\n'
  )}\n</urlset>\n`;

  const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  await fs.writeFile(outPath, xml, 'utf8');
  console.log(`Wrote ${outPath} with ${entries.length} URLs for main sitemap`);
}

main().catch((err) => {
  console.error('Failed to generate main sitemap:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection while generating main sitemap:', err);
  process.exit(1);
});
