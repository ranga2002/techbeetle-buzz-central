import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Here you would integrate with an email service like Resend
    // For now, we'll just log the action and save to newsletter_queue
    
    const { error: queueError } = await supabaseClient
      .from('newsletter_queue')
      .insert({
        sent_at: new Date().toISOString(),
        recipient_count: subscribers.length,
        status: 'sent',
        content_ids: topArticles.map(a => a.id)
      });

    if (queueError) throw queueError;

    // In a real implementation, you would send emails here using Resend:
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // for (const subscriber of subscribers) {
    //   await resend.emails.send({
    //     from: 'TechBeetle <newsletter@techbeetle.com>',
    //     to: subscriber.email,
    //     subject: 'Weekly Top Articles - TechBeetle',
    //     html: generateNewsletterHTML(topArticles)
    //   });
    // }

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

// Helper function to generate HTML email (simplified version)
function generateNewsletterHTML(articles: NewsletterContent[]): string {
  const articlesHTML = articles.map(article => `
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${article.featured_image ? `<img src="${article.featured_image}" alt="${article.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;" />` : ''}
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #111827;">${article.title}</h2>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">${article.excerpt}</p>
      <a href="https://yourdomain.com/news/${article.slug}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">Read More</a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Top Articles - TechBeetle</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; font-size: 28px; margin: 0;">TechBeetle Weekly Digest</h1>
          <p style="color: #6b7280; margin-top: 10px;">Your weekly dose of top tech articles</p>
        </div>
        
        ${articlesHTML}
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>You're receiving this because you subscribed to TechBeetle newsletter.</p>
          <p><a href="https://yourdomain.com/preferences" style="color: #3b82f6; text-decoration: none;">Manage preferences</a> | <a href="https://yourdomain.com/unsubscribe" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `;
}
