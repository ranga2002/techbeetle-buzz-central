import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productUrl } = await req.json()
    console.log('Received request to scrape:', productUrl)

    if (!productUrl) {
      throw new Error('Product URL is required')
    }

    // Normalize Amazon URL
    let normalizedUrl = productUrl.trim()
    
    // Handle short Amazon links (amzn.in/d/...)
    if (normalizedUrl.includes('amzn.in') || normalizedUrl.includes('amzn.to')) {
      console.log('Detected short Amazon URL, following redirect...')
      try {
        const redirectResponse = await fetch(normalizedUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        })
        normalizedUrl = redirectResponse.url
        console.log('Redirected to:', normalizedUrl)
      } catch (e) {
        console.error('Redirect failed:', e)
      }
    }

    // Ensure URL has protocol
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    console.log('Fetching URL:', normalizedUrl)

    // Attempt to fetch the page with headers that mimic a real browser
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch product page: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log('Successfully fetched HTML, length:', html.length)

    // Parse product data from HTML
    const productData = {
      title: extractTitle(html),
      price: extractPrice(html),
      rating: extractRating(html),
      images: extractImages(html),
      brand: extractBrand(html),
      description: extractDescription(html),
      model: extractModel(html),
    }

    console.log('Extracted product data:', {
      ...productData,
      hasTitle: !!productData.title,
      hasPrice: !!productData.price,
      hasImages: productData.images.length > 0
    })

    // Validate that we got at least some data
    if (!productData.title) {
      throw new Error('Could not extract product title. Amazon may be blocking the request or the page structure has changed.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: productData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error scraping product:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        suggestion: 'Amazon may be blocking automated requests. Please try: 1) Verifying the link is valid and accessible, 2) Using a different link format, or 3) Manually entering product details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function extractTitle(html: string): string {
  const titlePatterns = [
    /<span id="productTitle"[^>]*>\s*(.*?)\s*<\/span>/s,
    /<h1[^>]*id="title"[^>]*>\s*(.*?)\s*<\/h1>/s,
    /<div id="titleSection"[^>]*>.*?<h1[^>]*>\s*(.*?)\s*<\/h1>/s,
  ]

  for (const pattern of titlePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ')
    }
  }

  return ''
}

function extractPrice(html: string): number | null {
  const pricePatterns = [
    /<span class="a-price-whole">([^<]+)<\/span>/,
    /<span class="a-offscreen">\s*[₹$£€]?\s*([\d,]+\.?\d*)\s*<\/span>/,
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/,
    /id="priceblock_ourprice"[^>]*>\s*[₹$£€]?\s*([\d,]+\.?\d*)/,
    /id="priceblock_dealprice"[^>]*>\s*[₹$£€]?\s*([\d,]+\.?\d*)/,
  ]

  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const priceStr = match[1].replace(/[,₹$£€\s]/g, '').trim()
      const price = parseFloat(priceStr)
      if (!isNaN(price) && price > 0) {
        return price
      }
    }
  }

  return null
}

function extractRating(html: string): number | null {
  const ratingPatterns = [
    /<span class="a-icon-alt">\s*([\d.]+)\s*out of 5 stars\s*<\/span>/,
    /<i[^>]*class="[^"]*a-star[^"]*"[^>]*><span[^>]*>([\d.]+)\s*out of/,
    /<span[^>]*data-hook="rating-out-of-text"[^>]*>([\d.]+)\s*out of/,
  ]

  for (const pattern of ratingPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const rating = parseFloat(match[1])
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        return rating
      }
    }
  }

  return null
}

function extractImages(html: string): string[] {
  const images: string[] = []
  
  const imagePatterns = [
    /<img[^>]*id="landingImage"[^>]*data-old-hires="([^"]+)"/,
    /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/,
    /<img[^>]*data-a-dynamic-image="[^"]*"([^"]+)"/,
    /<div[^>]*id="imageBlock"[^>]*>.*?<img[^>]*src="([^"]+)"/s,
  ]

  for (const pattern of imagePatterns) {
    const matches = html.matchAll(new RegExp(pattern, 'g'))
    for (const match of matches) {
      if (match[1] && match[1].startsWith('http')) {
        // Clean up image URL - remove size parameters for higher quality
        let imageUrl = match[1].split('._')[0]
        if (!images.includes(imageUrl)) {
          images.push(imageUrl)
        }
      }
    }
    if (images.length > 0) break
  }

  return images
}

function extractBrand(html: string): string {
  const brandPatterns = [
    /<a id="bylineInfo"[^>]*>\s*(?:Visit the |Brand: )?(.*?)(?:\s*Store)?\s*<\/a>/,
    /<tr[^>]*>\s*<td[^>]*>Brand<\/td>\s*<td[^>]*>\s*(.*?)\s*<\/td>/s,
    /<span class="a-size-base po-break-word">\s*(.*?)\s*<\/span>/,
  ]

  for (const pattern of brandPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].replace(/<[^>]*>/g, '').trim()
    }
  }

  return ''
}

function extractModel(html: string): string {
  const modelPatterns = [
    /<tr[^>]*>\s*<td[^>]*>Model Number<\/td>\s*<td[^>]*>\s*(.*?)\s*<\/td>/s,
    /<tr[^>]*>\s*<td[^>]*>Model<\/td>\s*<td[^>]*>\s*(.*?)\s*<\/td>/s,
    /<span[^>]*>\s*Model:\s*(.*?)\s*<\/span>/,
  ]

  for (const pattern of modelPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].replace(/<[^>]*>/g, '').trim()
    }
  }

  return ''
}

function extractDescription(html: string): string {
  const descPatterns = [
    /<div id="feature-bullets"[^>]*>\s*<ul[^>]*>(.*?)<\/ul>/s,
    /<div id="productDescription"[^>]*>\s*<p>(.*?)<\/p>/s,
    /<div[^>]*class="[^"]*a-section[^"]*product-description[^"]*"[^>]*>(.*?)<\/div>/s,
  ]

  for (const pattern of descPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      // Extract text from bullets
      const bullets = match[1].match(/<li[^>]*>\s*<span[^>]*>(.*?)<\/span>\s*<\/li>/gs)
      if (bullets && bullets.length > 0) {
        return bullets
          .map(b => b.replace(/<[^>]*>/g, '').trim())
          .filter(b => b.length > 10)
          .slice(0, 5)
          .join('. ')
      }
      
      // Fallback to plain text extraction
      const plainText = match[1].replace(/<[^>]*>/g, '').trim()
      if (plainText.length > 20) {
        return plainText.substring(0, 500).trim()
      }
    }
  }

  return ''
}
