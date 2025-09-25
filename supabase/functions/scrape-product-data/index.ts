import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductData {
  title: string
  description: string
  specs: Record<string, any>
  images: string[]
  price: number
  retailer: string
  url: string
  rating?: number
  pros?: string[]
  cons?: string[]
  brand?: string
  model?: string
  availability?: string
}

// Function to scrape Amazon product data
async function scrapeAmazonProduct(asin: string, fullUrl?: string): Promise<ProductData | null> {
  try {
    let productUrl = fullUrl;
    
    // If we don't have the full URL, construct it
    if (!productUrl && asin) {
      productUrl = `https://www.amazon.in/dp/${asin}`;
    }
    
    if (!productUrl) {
      throw new Error('No valid product URL provided');
    }

    console.log('Attempting to scrape Amazon product:', productUrl);
    
    // Try to fetch the Amazon page with proper headers
    const response = await fetch(productUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Amazon page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Successfully fetched Amazon page, HTML length:', html.length);
    
    // Parse the HTML content
    const productData = parseAmazonHTML(html, asin, productUrl);
    
    if (!productData) {
      throw new Error('Failed to parse product data from Amazon page');
    }
    
    console.log('Successfully parsed product data:', productData.title);
    return productData;

  } catch (error) {
    console.error('Error scraping Amazon product:', error);
    
    // If scraping fails, don't fall back to mock data - throw the error
    throw new Error(`Failed to scrape Amazon product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to parse Amazon HTML and extract product data
function parseAmazonHTML(html: string, asin: string, url: string): ProductData | null {
  try {
    console.log('Parsing Amazon HTML for ASIN:', asin);
    
    // Extract title - try multiple selectors
    let title = '';
    const titleSelectors = [
      /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
      /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<]*Amazon\.in[^<]*)<\/title>/i
    ];
    
    for (const selector of titleSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        title = match[1].trim().replace(/\s+/g, ' ');
        if (title.includes('Amazon.in')) {
          title = title.split(' : ')[0] || title.split(' - ')[0] || title;
        }
        break;
      }
    }

    if (!title) {
      console.error('Could not extract product title');
      throw new Error('Product title not found on page');
    }

    // Extract price - handle Indian currency formats
    let price = 0;
    const priceSelectors = [
      /₹([0-9,]+(?:\.[0-9]{2})?)/g,
      /"priceAmount":([0-9.]+)/g,
      /Rs\.?\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /INR\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /"price_to_display":\s*"[^0-9]*([0-9,]+(?:\.[0-9]{2})?)/g
    ];
    
    for (const priceRegex of priceSelectors) {
      const matches = [...html.matchAll(priceRegex)];
      if (matches.length > 0) {
        for (const match of matches) {
          const priceStr = match[1].replace(/,/g, '');
          const parsedPrice = parseFloat(priceStr);
          if (parsedPrice > 0 && parsedPrice < 10000000) { // Reasonable price range
            price = parsedPrice;
            break;
          }
        }
        if (price > 0) break;
      }
    }

    // Extract rating
    let rating = 0;
    const ratingSelectors = [
      /([0-9]\.[0-9])\s*out of 5 stars/i,
      /"ratingValue":"([0-9]\.[0-9])"/i,
      /data-hook="average-star-rating"[^>]*>.*?([0-9]\.[0-9])/i
    ];
    
    for (const selector of ratingSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        rating = parseFloat(match[1]);
        if (rating >= 0 && rating <= 5) break;
      }
    }

    // Extract brand
    let brand = '';
    const brandSelectors = [
      /"brand":\s*{\s*"name":\s*"([^"]+)"/i,
      /"brand":\s*"([^"]+)"/i,
      /Brand:\s*([^<\n\r]+)/i,
      /Visit the ([^<\s]+) Store/i,
      /by\s+([^<\(\n\r]+)(?:\s*\(|<)/i
    ];
    
    for (const selector of brandSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        brand = match[1].trim();
        // Clean up brand name
        if (brand && brand.length > 0 && brand.length < 50) {
          break;
        }
      }
    }

    // Extract images
    const images: string[] = [];
    const imageSelectors = [
      /"hiRes":"([^"]+)"/g,
      /"large":"([^"]+)"/g,
      /"main":{"[^"]+":"([^"]+)"/g,
      /data-old-hires="([^"]+)"/g
    ];
    
    for (const selector of imageSelectors) {
      const matches = [...html.matchAll(selector)];
      for (const match of matches) {
        const imageUrl = match[1];
        if (imageUrl && imageUrl.startsWith('http') && !images.includes(imageUrl)) {
          images.push(imageUrl);
          if (images.length >= 3) break;
        }
      }
      if (images.length >= 3) break;
    }

    // Generate description from available data
    const description = `${title}${brand ? ` by ${brand}` : ''}. This product is available on Amazon India with ${rating > 0 ? `a ${rating}/5 star rating` : 'customer reviews'}.${price > 0 ? ` Current price: ₹${price.toLocaleString('en-IN')}` : ''}`;

    // Create product data object
    const productData: ProductData = {
      title: title,
      description: description,
      specs: {
        asin: asin,
        source: 'Amazon India',
        scraped_at: new Date().toISOString()
      },
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'],
      price: price || 0,
      retailer: url.includes('amazon.in') ? 'Amazon India' : 'Amazon',
      url: url,
      rating: rating || 0,
      brand: brand || 'Unknown',
      model: asin,
      availability: 'available',
      pros: [
        'Available on Amazon with reliable delivery',
        'Customer reviews available for reference',
        'Secure payment options'
      ],
      cons: [
        'Price may vary based on offers',
        'Availability subject to stock'
      ]
    };

    console.log('Successfully parsed product:', {
      title: productData.title,
      price: productData.price,
      rating: productData.rating,
      brand: productData.brand,
      imageCount: productData.images.length
    });

    return productData;

  } catch (error) {
    console.error('Error parsing Amazon HTML:', error);
    throw new Error(`Failed to parse product data: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
  }
}

// Function to get current pricing from multiple retailers
async function fetchPricingData(productName: string) {
  // Simulate fetching from multiple retailers for Indian market
  const retailers = [
    { name: 'Amazon India', price: 899.00, url: 'https://amazon.in/...' },
    { name: 'Flipkart', price: 929.00, url: 'https://flipkart.com/...' },
    { name: 'Croma', price: 949.00, url: 'https://croma.com/...' }
  ]
  
  return retailers
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { product_id, source_type = 'amazon', product_url } = await req.json()

    let productData: ProductData | null = null

    console.log('Scrape request:', { product_id, source_type, product_url });

    if (source_type === 'amazon') {
      productData = await scrapeAmazonProduct(product_id, product_url)
    }

    if (!productData) {
      console.error('No product data returned from scraper');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Product not found or could not be scraped',
          details: 'Unable to extract product information from the provided URL. Please check if the URL is valid and accessible.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get pricing from multiple retailers
    const pricingData = await fetchPricingData(productData.title)

    return new Response(
      JSON.stringify({
        success: true,
        product: productData,
        pricing: pricingData,
        scraped_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in scrape-product-data function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage.includes('Failed to fetch') ? 503 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Scraping failed',
        details: errorMessage,
        suggestions: [
          'Check if the Amazon URL is valid and accessible',
          'Ensure the product page is not geo-restricted',
          'Try again in a few moments as this might be a temporary issue'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
    )
  }
})