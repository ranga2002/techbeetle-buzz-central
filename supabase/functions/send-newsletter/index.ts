import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NewsletterContent {
  id: string;
  title: string | null;
  excerpt: string | null;
  featured_image: string | null;
  slug: string | null;
  published_at: string | null;
  views_count: number | null;
  likes_count: number | null;
  reading_time: number | null;
  categories?: { name: string; color: string } | { name: string; color: string }[];
}

type Subscriber = { email: string };

const requiredEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
};

const SUPABASE_URL = requiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = requiredEnv('RESEND_API_KEY');

const SITE_URL = (Deno.env.get('SITE_URL') ?? Deno.env.get('PUBLIC_SITE_URL') ?? SUPABASE_URL).replace(/\/$/, '');
const NEWSLETTER_FROM = Deno.env.get('NEWSLETTER_FROM') ?? 'Tech Beetle <onboarding@resend.dev>';
const NEWSLETTER_SUBJECT = Deno.env.get('NEWSLETTER_SUBJECT') ?? 'Weekly Top Tech Articles - Tech Beetle';
const LIST_UNSUBSCRIBE_URL = SITE_URL ? `${SITE_URL}/preferences` : '';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ message: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 },
    );
  }

  try {
    const topArticles = await fetchTopArticles();
    if (!topArticles.length) {
      console.log('No articles found for this week');
      return new Response(
        JSON.stringify({ message: 'No articles to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    const subscribers = await fetchSubscribers();
    if (!subscribers.length) {
      console.log('No active subscribers');
      return new Response(
        JSON.stringify({ message: 'No active subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers with ${topArticles.length} articles`);

    const html = generateNewsletterHTML(topArticles);
    await sendEmails(subscribers, html);
    await recordQueue(topArticles, subscribers.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter sent to ${subscribers.length} subscribers`,
        articles_count: topArticles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error sending newsletter:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});

async function fetchTopArticles(): Promise<NewsletterContent[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabaseClient
    .from('content')
    .select(`
      id,
      title,
      excerpt,
      featured_image,
      slug,
      published_at,
      views_count,
      likes_count,
      reading_time,
      categories (name, color)
    `)
    .eq('status', 'published')
    .gte('published_at', oneWeekAgo.toISOString())
    .order('views_count', { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  return data ?? [];
}

async function fetchSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabaseClient
    .from('newsletter_subscriptions')
    .select('email')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  return (data ?? []).filter((subscriber): subscriber is Subscriber => Boolean(subscriber.email));
}

async function sendEmails(subscribers: Subscriber[], html: string): Promise<void> {
  const listUnsubscribeHeader = LIST_UNSUBSCRIBE_URL ? `<${LIST_UNSUBSCRIBE_URL}>` : '';

  const sendTasks = subscribers.map(async ({ email }) => {
    const { error } = await resend.emails.send({
      from: NEWSLETTER_FROM,
      to: email,
      subject: NEWSLETTER_SUBJECT,
      html,
      headers: listUnsubscribeHeader ? { 'List-Unsubscribe': listUnsubscribeHeader } : undefined,
    });

    if (error) {
      throw new Error(`Failed to send to ${email}: ${error.message ?? error}`);
    }
  });

  const results = await Promise.allSettled(sendTasks);
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

  if (failures.length) {
    const sample = failures[0]?.reason?.message ?? failures[0]?.reason ?? 'Unknown send failure';
    throw new Error(`Failed to send ${failures.length} of ${subscribers.length} emails. Example: ${sample}`);
  }
}

async function recordQueue(articles: NewsletterContent[], recipientCount: number): Promise<void> {
  const { error } = await supabaseClient.from('newsletter_queue').insert({
    sent_at: new Date().toISOString(),
    recipient_count: recipientCount,
    status: 'sent',
    content_ids: articles.map((article) => article.id),
  });

  if (error) {
    throw new Error(`Failed to record newsletter queue: ${error.message}`);
  }
}

function generateNewsletterHTML(articles: NewsletterContent[]): string {
  const articlesHTML = articles
    .map((article) => {
      const category = normalizeCategory(article.categories);
      const title = article.title ?? 'Untitled';
      const excerpt = article.excerpt ?? '';
      const slug = article.slug ?? article.id;
      const articleUrl = buildArticleUrl(slug);
      const imageBlock = article.featured_image
        ? `
              <img src="${escapeAttribute(article.featured_image)}" alt="${escapeAttribute(title)}" style="width: 100%; height: 250px; object-fit: cover; display: block;" />
            `
        : '';

      const categoryBlock = category
        ? `
                    <div style="display: inline-block; padding: 4px 12px; background-color: ${escapeAttribute(category.color)}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px;">
                      ${escapeHtml(category.name)}
                    </div>
          `
        : '';

      return `
    <tr>
      <td style="padding: 0 0 30px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              ${imageBlock}
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 24px;">
                    ${categoryBlock}
                    <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">
                      ${escapeHtml(title)}
                    </h2>
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      ${escapeHtml(excerpt)}
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 16px;">
                          <span style="color: #9ca3af; font-size: 13px;">&#9201; ${article.reading_time ?? 5} min read</span>
                        </td>
                        <td style="padding-right: 16px;">
                          <span style="color: #9ca3af; font-size: 13px;">&#128065; ${article.views_count ?? 0} views</span>
                        </td>
                        <td>
                          <span style="color: #9ca3af; font-size: 13px;">&#10084; ${article.likes_count ?? 0} likes</span>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 20px;">
                      <a href="${articleUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                        Read Article &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Top Articles - Tech Beetle</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                <tr>
                  <td style="text-align: center; padding: 0 0 32px 0;">
                    <h1 style="margin: 0; font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                      &#128030; Tech Beetle
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 18px; font-weight: 500;">
                      Your Weekly Tech Digest
                    </p>
                    <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 14px;">
                      ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                </tr>
                ${articlesHTML}
                <tr>
                  <td style="text-align: center; padding: 32px 0 0 0; border-top: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      You are receiving this because you subscribed to the TechBeetle newsletter.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                      <a href="${LIST_UNSUBSCRIBE_URL || '#'}" style="color: #667eea; text-decoration: none; font-weight: 500;">Manage preferences</a>
                      <span style="margin: 0 8px; color: #d1d5db;">&bull;</span>
                      <a href="${LIST_UNSUBSCRIBE_URL || '#'}" style="color: #667eea; text-decoration: none; font-weight: 500;">Unsubscribe</a>
                    </p>
                    <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} TechBeetle. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function normalizeCategory(category: NewsletterContent['categories']): { name: string; color: string } | null {
  if (!category) return null;
  if (Array.isArray(category)) {
    return category[0] ?? null;
  }
  return category;
}

function buildArticleUrl(slug: string): string {
  const encodedSlug = encodeURIComponent(slug);
  return SITE_URL ? `${SITE_URL}/news/${encodedSlug}` : `/news/${encodedSlug}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
