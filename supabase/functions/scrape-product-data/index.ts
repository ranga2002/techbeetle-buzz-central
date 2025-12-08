import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

type Provider = "scrape" | "dummyjson" | "fakestore";

const regionToCurrency = (region?: string): string => {
  const code = (region || "").toUpperCase();
  if (code.startsWith("CA")) return "CAD";
  if (code.startsWith("IN")) return "INR";
  if (code.startsWith("US")) return "USD";
  return "USD";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productUrl, provider = "scrape", query, region } = await req.json();
    const targetCurrency = regionToCurrency(region);

    if (!productUrl && provider === "scrape") {
      throw new Error("productUrl is required for scraping");
    }

    if (provider === "dummyjson") {
      const data = await fetchDummyJson(query || productUrl, targetCurrency);
      return jsonResponse({ success: true, data });
    }

    if (provider === "fakestore") {
      const data = await fetchFakeStore(query || productUrl, targetCurrency);
      return jsonResponse({ success: true, data });
    }

    // Default: scrape the provided URL (best effort, works for many Amazon links but may be blocked).
    const data = await scrapeHtml(productUrl, targetCurrency);
    return jsonResponse({ success: true, data });
  } catch (error: any) {
    console.error("Error scraping product:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message,
        suggestion:
          "If scraping is blocked, try provider: 'dummyjson' with a search term, or 'fakestore' to pull demo products.",
      },
      400,
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function scrapeHtml(productUrl: string, targetCurrency: string) {
  console.log("Received request to scrape:", productUrl);

  let normalizedUrl = productUrl.trim();

  if (normalizedUrl.includes("amzn.in") || normalizedUrl.includes("amzn.to")) {
    try {
      const redirectResponse = await fetch(normalizedUrl, {
        redirect: "follow",
        headers: { "User-Agent": chromeUa() },
      });
      normalizedUrl = redirectResponse.url;
    } catch (e) {
      console.error("Redirect failed:", e);
    }
  }

  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  console.log("Fetching URL:", normalizedUrl);
  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": chromeUa(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  console.log("Fetched HTML length:", html.length);

  const productData = {
    title: extractTitle(html),
    price: extractPrice(html),
    rating: extractRating(html),
    images: extractImages(html),
    brand: extractBrand(html),
    description: extractDescription(html),
    model: extractModel(html),
    source: normalizedUrl,
  };
  if (productData.price !== null && productData.price !== undefined) {
    const converted = await convertPrice(productData.price, targetCurrency);
    productData.price = converted.value;
    (productData as any).price_currency = converted.currency;
  }

  if (!productData.title) {
    throw new Error("Could not extract product title. The site may be blocking requests or changed markup.");
  }

  return productData;
}

async function fetchDummyJson(term: string, targetCurrency: string) {
  const q = encodeURIComponent(term || "tech");
  const url = `https://dummyjson.com/products/search?q=${q}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DummyJSON fetch failed: ${res.statusText}`);
  const json = await res.json();
  const first = json.products?.[0];
  if (!first) throw new Error("No products found in DummyJSON");
  const price = await convertPrice(first.price, targetCurrency);
  return {
    title: first.title,
    price: price.value,
    rating: first.rating,
    images: first.images || [first.thumbnail],
    brand: first.brand,
    description: first.description,
    model: first.sku || first.category,
    source: "dummyjson.com",
    price_currency: price.currency,
  };
}

async function fetchFakeStore(term: string, targetCurrency: string) {
  const res = await fetch("https://fakestoreapi.com/products");
  if (!res.ok) throw new Error(`FakeStore fetch failed: ${res.statusText}`);
  const products = await res.json();
  const match =
    products.find((p: any) => p.title.toLowerCase().includes((term || "").toLowerCase())) || products[0];
  const price = await convertPrice(match.price, targetCurrency);
  return {
    title: match.title,
    price: price.value,
    rating: match.rating?.rate,
    images: [match.image],
    brand: match.category,
    description: match.description,
    model: match.id?.toString(),
    source: "fakestoreapi.com",
    price_currency: price.currency,
  };
}

async function convertPrice(value: number, currency: string): Promise<{ value: number; currency: string }> {
  if (currency === "USD") return { value, currency };
  try {
    const res = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${currency}`);
    const json = await res.json();
    const rate = json?.rates?.[currency];
    if (rate) {
      return { value: Math.round(value * rate), currency };
    }
  } catch (e) {
    console.error("Rate conversion failed", e);
  }
  return { value, currency: "USD" };
}

const chromeUa = () =>
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
