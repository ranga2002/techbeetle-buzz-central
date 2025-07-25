
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

    // Parse request body to get search query
    let searchQuery = 'technology OR tech OR smartphone OR laptop OR AI OR software';
    try {
      const body = await req.json();
      if (body.query) {
        searchQuery = body.query;
      }
    } catch (e) {
      console.log('No query provided, using default tech search');
    }

    console.log('Starting news search for:', searchQuery);

    // Using NewsAPI key
    const newsApiKey = '055584e2130a462892c6ce319905ed63';
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    // Fetch news from NewsAPI with the search query
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${newsApiKey}`
    );

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('NewsAPI Error:', errorText);
      throw new Error(`Failed to fetch news: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];

    console.log(`Fetched ${articles.length} articles from NewsAPI for query: ${searchQuery}`);

    // Filter out removed or invalid articles
    const validArticles = articles.filter(article => 
      article.title && 
      article.description && 
      article.title !== '[Removed]' &&
      article.description !== '[Removed]'
    );

    console.log(`Returning ${validArticles.length} valid articles`);

    // Return the articles directly for frontend consumption
    return new Response(
      JSON.stringify({
        success: true,
        articles: validArticles,
        query: searchQuery,
        totalFound: validArticles.length
      }),
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
