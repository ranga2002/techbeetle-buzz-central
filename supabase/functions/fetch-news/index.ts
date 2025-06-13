
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // You would need to add NEWS_API_KEY to your Supabase secrets
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    // Fetch news from NewsAPI
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=technology&sortBy=publishedAt&pageSize=10&apiKey=${newsApiKey}`
    );

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news');
    }

    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];

    console.log(`Fetched ${articles.length} articles`);

    // Get admin user to assign as author
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminProfile) {
      throw new Error('No admin user found');
    }

    // Get tech category
    let { data: techCategory } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', 'technology')
      .single();

    // Create tech category if it doesn't exist
    if (!techCategory) {
      const { data: newCategory } = await supabaseClient
        .from('categories')
        .insert([{
          name: 'Technology',
          slug: 'technology',
          description: 'Latest technology news and updates',
          is_active: true
        }])
        .select()
        .single();
      
      techCategory = newCategory;
    }

    let insertedCount = 0;

    for (const article of articles) {
      if (!article.title || !article.description) continue;

      // Check if article already exists
      const { data: existingArticle } = await supabaseClient
        .from('content')
        .select('id')
        .eq('title', article.title)
        .single();

      if (existingArticle) {
        console.log(`Article "${article.title}" already exists, skipping`);
        continue;
      }

      // Create slug from title
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Insert article
      const { error } = await supabaseClient
        .from('content')
        .insert([{
          title: article.title,
          slug: slug,
          excerpt: article.description,
          content: article.content || article.description,
          featured_image: article.urlToImage,
          author_id: adminProfile.id,
          category_id: techCategory?.id,
          content_type: 'news',
          status: 'published',
          published_at: new Date(article.publishedAt).toISOString(),
          meta_title: article.title,
          meta_description: article.description
        }]);

      if (error) {
        console.error('Error inserting article:', error);
      } else {
        insertedCount++;
        console.log(`Inserted article: ${article.title}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${insertedCount} new articles` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
