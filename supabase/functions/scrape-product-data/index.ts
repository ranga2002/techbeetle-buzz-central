
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
async function scrapeAmazonProduct(asin: string): Promise<ProductData | null> {
  try {
    // In production, you'd use a proper scraping service like ScrapingBee or Apify
    // For demo purposes, we'll simulate real product data
    const mockData: Record<string, ProductData> = {
      'B0BDHB9Y8H': { // iPhone 15 Pro Max
        title: 'Apple iPhone 15 Pro Max (256GB) - Natural Titanium',
        description: 'The iPhone 15 Pro Max features a titanium design, A17 Pro chip, and advanced camera system with 5x optical zoom.',
        specs: {
          display: '6.7-inch Super Retina XDR',
          processor: 'A17 Pro chip',
          storage: '256GB',
          camera: '48MP Main, 12MP Ultra Wide, 12MP Telephoto',
          battery: 'Up to 29 hours video playback',
          connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3'
        },
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'
        ],
        price: 1199.00,
        retailer: 'Amazon',
        url: `https://amazon.com/dp/${asin}`,
        rating: 4.5,
        pros: [
          'Exceptional build quality with titanium construction',
          'Outstanding camera performance with 5x zoom',
          'Powerful A17 Pro processor',
          'Long battery life'
        ],
        cons: [
          'Very expensive',
          'Heavy despite titanium construction',
          'USB-C transition may require new accessories'
        ]
      },
      'B0C63GV3JB': { // Samsung Galaxy S24 Ultra
        title: 'Samsung Galaxy S24 Ultra 5G AI Smartphone with Galaxy AI (Titanium Gray, 12GB, 256GB Storage)',
        description: 'Galaxy AI - Welcome to the era of mobile AI. With Galaxy S24 Ultra and One UI in your hands, you can unleash completely new levels of creativity, productivity and possibility. Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra built with a new titanium exterior and a 17.25cm flat display. With the most megapixels on a Galaxy smartphone ever (200MP) and AI processing.',
        specs: {
          display: '17.25cm flat display',
          processor: 'Snapdragon 8 Gen 3 for Galaxy',
          storage: '12GB RAM + 256GB Storage',
          camera: '200MP Camera with ProVisual Engine',
          battery: '5000mAh Battery',
          connectivity: '5G'
        },
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'
        ],
        price: 72999.00,
        retailer: 'Amazon',
        url: `https://amazon.com/dp/${asin}`,
        rating: 4.5,
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        availability: 'in_stock',
        pros: [
          'Galaxy AI features for enhanced productivity',
          'Titanium Frame with premium build quality', 
          'Epic 200MP Camera with ProVisual engine',
          'Powerful Snapdragon 8 Gen 3 processor',
          'Built-in S Pen and Knox security'
        ],
        cons: [
          'Premium price point',
          'Large size may not suit all users',
          'Battery life could be better with heavy usage'
        ]
      }
    }
    
    return mockData[asin] || null
  } catch (error) {
    console.error('Error scraping Amazon:', error)
    return null
  }
}

// Function to get current pricing from multiple retailers
async function fetchPricingData(productName: string) {
  // Simulate fetching from multiple retailers
  const retailers = [
    { name: 'Amazon', price: 1199.00, url: 'https://amazon.com/...' },
    { name: 'Best Buy', price: 1199.99, url: 'https://bestbuy.com/...' },
    { name: 'Apple Store', price: 1199.00, url: 'https://apple.com/...' }
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

    const { product_id, source_type = 'amazon' } = await req.json()

    let productData: ProductData | null = null

    if (source_type === 'amazon') {
      productData = await scrapeAmazonProduct(product_id)
    }

    if (!productData) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
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
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
