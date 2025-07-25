
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

    // Using your provided News API key
    const newsApiKey = '055584e2130a462892c6ce319905ed63';
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    console.log('Starting news fetch process...');

    // Fetch tech news from NewsAPI
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=technology OR tech OR smartphone OR laptop OR AI OR software&sortBy=publishedAt&pageSize=20&language=en&apiKey=${newsApiKey}`
    );

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('NewsAPI Error:', errorText);
      throw new Error(`Failed to fetch news: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];

    console.log(`Fetched ${articles.length} articles from NewsAPI`);

    // Get admin user to assign as author
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.log('No admin user found, creating articles without author');
    }

    // Get or create tech category
    let { data: techCategory } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', 'technology')
      .single();

    if (!techCategory) {
      const { data: newCategory, error: categoryError } = await supabaseClient
        .from('categories')
        .insert([{
          name: 'Technology',
          slug: 'technology',
          description: 'Latest technology news and updates',
          is_active: true,
          color: '#3B82F6'
        }])
        .select()
        .single();
      
      if (categoryError) {
        console.error('Error creating category:', categoryError);
      } else {
        techCategory = newCategory;
        console.log('Created technology category');
      }
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      if (!article.title || !article.description || article.title === '[Removed]') {
        console.log('Skipping article with missing or removed content');
        continue;
      }

      // Check if article already exists
      const { data: existingArticle } = await supabaseClient
        .from('content')
        .select('id')
        .eq('title', article.title)
        .single();

      if (existingArticle) {
        console.log(`Article "${article.title}" already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Create slug from title
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
        .substring(0, 100); // Limit slug length

      // Prepare content with source attribution
      const content = `${article.description || ''}

${article.content ? article.content.replace('[+\\d+ chars]', '') : ''}

**Source:** ${article.source?.name || 'Unknown'}
**Original URL:** ${article.url}`;

      // Insert article
      const { error } = await supabaseClient
        .from('content')
        .insert([{
          title: article.title.substring(0, 255), // Limit title length
          slug: slug,
          excerpt: article.description?.substring(0, 500) || '', // Limit excerpt length
          content: content,
          featured_image: article.urlToImage,
          author_id: adminProfile?.id || null,
          category_id: techCategory?.id || null,
          content_type: 'news',
          status: 'published',
          published_at: new Date(article.publishedAt).toISOString(),
          meta_title: article.title.substring(0, 60),
          meta_description: article.description?.substring(0, 160) || '',
          views_count: 0
        }]);

      if (error) {
        console.error('Error inserting article:', error);
        console.error('Article data:', {
          title: article.title,
          slug: slug,
          publishedAt: article.publishedAt
        });
      } else {
        insertedCount++;
        console.log(`Inserted article: ${article.title}`);
      }
    }

    const summary = {
      success: true,
      message: `Successfully processed ${insertedCount} new articles (${skippedCount} duplicates skipped)`,
      totalFetched: articles.length,
      inserted: insertedCount,
      skipped: skippedCount
    };

    console.log('News fetch completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
