import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsletterContent {
  id: string;
  title: string;
  excerpt: string;
  featured_image: string;
  slug: string;
  published_at: string;
  views_count: number;
  likes_count: number;
  reading_time: number;
  categories?: {
    name: string;
    color: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get top articles from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: topArticles, error: articlesError } = await supabaseClient
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

    if (articlesError) throw articlesError;

    if (!topArticles || topArticles.length === 0) {
      console.log('No articles found for this week');
      return new Response(
        JSON.stringify({ message: 'No articles to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get active newsletter subscribers
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from('newsletter_subscriptions')
      .select('email')
      .eq('is_active', true);

    if (subscribersError) throw subscribersError;

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers');
      return new Response(
        JSON.stringify({ message: 'No active subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers with ${topArticles.length} articles`);

    // Send emails to all subscribers
    const emailPromises = subscribers.map(subscriber => 
      resend.emails.send({
        from: 'TechBeetle <onboarding@resend.dev>',
        to: subscriber.email,
        subject: 'Weekly Top Tech Articles - TechBeetle',
        html: generateNewsletterHTML(topArticles)
      })
    );

    await Promise.all(emailPromises);

    // Save to newsletter queue
    const { error: queueError } = await supabaseClient
      .from('newsletter_queue')
      .insert({
        sent_at: new Date().toISOString(),
        recipient_count: subscribers.length,
        status: 'sent',
        content_ids: topArticles.map(a => a.id)
      });

    if (queueError) throw queueError;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Newsletter sent to ${subscribers.length} subscribers`,
        articles_count: topArticles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error sending newsletter:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to generate beautiful HTML email
function generateNewsletterHTML(articles: NewsletterContent[]): string {
  const articlesHTML = articles.map((article, index) => `
    <tr>
      <td style="padding: 0 0 30px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              ${article.featured_image ? `
                <img src="${article.featured_image}" alt="${article.title}" style="width: 100%; height: 250px; object-fit: cover; display: block;" />
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 24px;">
                    ${article.categories ? `
                      <div style="display: inline-block; padding: 4px 12px; background-color: ${article.categories.color}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px;">
                        ${article.categories.name}
                      </div>
                    ` : ''}
                    <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">
                      ${article.title}
                    </h2>
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      ${article.excerpt}
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 16px;">
                          <span style="color: #9ca3af; font-size: 13px;">📖 ${article.reading_time || 5} min read</span>
                        </td>
                        <td style="padding-right: 16px;">
                          <span style="color: #9ca3af; font-size: 13px;">👁️ ${article.views_count || 0} views</span>
                        </td>
                        <td>
                          <span style="color: #9ca3af; font-size: 13px;">❤️ ${article.likes_count || 0} likes</span>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 20px;">
                      <a href="https://mnlgianmqlcndjyovlxj.supabase.co/news/${article.slug}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                        Read Article →
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
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Top Articles - TechBeetle</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                <!-- Header -->
                <tr>
                  <td style="text-align: center; padding: 0 0 32px 0;">
                    <h1 style="margin: 0; font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                      🐞 TechBeetle
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 18px; font-weight: 500;">
                      Your Weekly Tech Digest
                    </p>
                    <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 14px;">
                      ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                </tr>
                
                <!-- Articles -->
                ${articlesHTML}
                
                <!-- Footer -->
                <tr>
                  <td style="text-align: center; padding: 32px 0 0 0; border-top: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      You're receiving this because you subscribed to TechBeetle newsletter.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                      <a href="https://mnlgianmqlcndjyovlxj.supabase.co/preferences" style="color: #667eea; text-decoration: none; font-weight: 500;">Manage preferences</a>
                      <span style="margin: 0 8px; color: #d1d5db;">•</span>
                      <a href="https://mnlgianmqlcndjyovlxj.supabase.co/preferences" style="color: #667eea; text-decoration: none; font-weight: 500;">Unsubscribe</a>
                    </p>
                    <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} TechBeetle. All rights reserved.
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
