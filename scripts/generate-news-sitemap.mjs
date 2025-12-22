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

const buildUrl = (base, slug) => `${base.replace(/\/+$/, '')}/news/${slug}`;

async function main() {
  const { data, error } = await supabase
    .from('content')
    .select('slug, updated_at')
    .eq('content_type', 'news')
    .eq('is_indexable', true);

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const newsEntries = (data || [])
    .filter((row) => row?.slug)
    .map((row) => {
      const loc = buildUrl(SITE_URL, row.slug);
      const lastmod = toDate(row.updated_at);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    });

  // Always keep at least the landing page so the file is never empty
  if (!newsEntries.length) {
    newsEntries.push(
      `  <url>\n    <loc>${SITE_URL.replace(/\/+$/, '')}/news</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.5</priority>\n  </url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${newsEntries.join(
    '\n'
  )}\n</urlset>\n`;

  const outPath = path.join(process.cwd(), 'public', 'news-sitemap.xml');
  await fs.writeFile(outPath, xml, 'utf8');
  console.log(`Wrote ${outPath} with ${data?.length ?? 0} news URLs`);
}

main().catch((err) => {
  console.error('Failed to generate news sitemap:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection while generating news sitemap:', err);
  process.exit(1);
});
