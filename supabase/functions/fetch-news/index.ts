import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    let isSearchRequest = false;
    
    try {
      const body = await req.json();
      if (body.query) {
        searchQuery = body.query;
        isSearchRequest = true;
      }
    } catch (e) {
      console.log('No query provided, will fetch and store latest tech news');
    }

    console.log('Search query:', searchQuery, 'Is search request:', isSearchRequest);

    // The Guardian API
    const guardianApiKey = '63b2f513-266b-4341-b855-0dac0f908fca';
    
    if (!guardianApiKey) {
      throw new Error('GUARDIAN_API_KEY not configured');
    }

    // Build the API URL
    const query = encodeURIComponent(searchQuery);
    const url = `https://content.guardianapis.com/search?q=${query}&show-fields=bodyText,thumbnail&order-by=newest&page-size=20&api-key=${guardianApiKey}`;
    
    console.log(`Fetching from URL: ${url}`);

    const newsResponse = await fetch(url);

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('The Guardian API Error:', errorText);
      throw new Error(`Failed to fetch news: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    const articles = newsData.response?.results || [];

    console.log(`Fetched ${articles.length} articles from The Guardian API`);

    // If this is a search request, return the articles directly
    if (isSearchRequest) {
      const formattedArticles = articles
        .filter(article => article.webTitle && article.webTitle !== '[Removed]')
        .map(article => ({
          id: article.id,
          title: article.webTitle,
          description: article.fields?.bodyText?.substring(0, 250) + '...' || '',
          urlToImage: article.fields?.thumbnail,
          publishedAt: article.webPublicationDate,
          url: article.webUrl,
          source: { name: 'The Guardian' }
        }));

      return new Response(
        JSON.stringify({
          success: true,
          articles: formattedArticles,
          query: searchQuery,
          totalFound: formattedArticles.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Otherwise, store articles in database (original functionality)
    if (articles.length === 0) {
      console.log("No new articles returned from the API.");
      return new Response(JSON.stringify({
        success: true,
        message: "No new articles found."
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    // Get admin user to assign as author
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminProfile) {
      console.log('No admin user found, will insert articles without an author.');
    }

    // Get or create the 'technology' category
    let { data: techCategory } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', 'technology')
      .single();

    if (!techCategory) {
      console.log("Technology category not found, creating it...");
      const { data: newCategory, error: categoryError } = await supabaseClient
        .from('categories')
        .insert({
          name: 'Technology',
          slug: 'technology',
          description: 'Latest technology news and updates from The Guardian',
          is_active: true,
          color: '#005689'
        })
        .select()
        .single();

      if (categoryError) {
        console.error('Error creating category:', categoryError);
      } else {
        techCategory = newCategory;
        console.log('Successfully created technology category.');
      }
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      const articleTitle = article.webTitle;

      // Skip articles that are clearly invalid
      if (!articleTitle || articleTitle === '[Removed]') {
        console.log('Skipping article with missing or removed title.');
        continue;
      }

      // Check if an article with the same title already exists
      const { data: existingArticle } = await supabaseClient
        .from('content')
        .select('id')
        .eq('title', articleTitle)
        .limit(1)
        .single();

      if (existingArticle) {
        console.log(`Article "${articleTitle}" already exists, skipping.`);
        skippedCount++;
        continue;
      }

      // Create a URL-friendly slug
      const slug = articleTitle
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
        .substring(0, 100);

      const bodyText = article.fields?.bodyText || '';
      const excerpt = bodyText.substring(0, 250) + (bodyText.length > 250 ? '...' : '');
      const content = `${bodyText}\n\n**Source:** The Guardian\n**Original URL:** ${article.webUrl}`;

      // Insert the new article
      const { error: insertError } = await supabaseClient
        .from('content')
        .insert({
          title: articleTitle.substring(0, 255),
          slug: slug,
          excerpt: excerpt,
          content: content,
          featured_image: article.fields?.thumbnail,
          author_id: adminProfile?.id || null,
          category_id: techCategory?.id || null,
          content_type: 'news',
          status: 'published',
          published_at: new Date(article.webPublicationDate).toISOString(),
          meta_title: articleTitle.substring(0, 60),
          meta_description: excerpt.substring(0, 160),
          views_count: 0
        });

      if (insertError) {
        console.error('Error inserting article:', insertError.message);
      } else {
        insertedCount++;
        console.log(`Inserted article: ${articleTitle}`);
      }
    }

    const summary = {
      success: true,
      message: `Successfully processed ${insertedCount} new articles (${skippedCount} duplicates skipped).`,
      totalFetched: articles.length,
      inserted: insertedCount,
      skipped: skippedCount
    };

    console.log('News fetch completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

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
