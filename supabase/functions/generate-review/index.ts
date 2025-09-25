
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate comprehensive review content
function generateReviewContent(productData: any): string {
  const { title, specs, pros, cons, rating } = productData
  
  return `
# ${title} Review: A Comprehensive Analysis

## Executive Summary

The ${title} represents a significant advancement in modern technology, offering a compelling blend of performance, design, and functionality. After extensive testing, we've evaluated every aspect of this device to provide you with an honest, detailed review.

## Design and Build Quality

The build quality of the ${title} immediately stands out. The attention to detail in the construction is evident from the moment you hold the device. The materials feel premium and the overall design aesthetic strikes a balance between form and function.

## Performance Analysis

### Processing Power
${specs.processor ? `Powered by the ${specs.processor}, this device delivers exceptional performance across all use cases.` : 'The processing capabilities meet modern demands with efficient performance.'}

### Display Technology
${specs.display ? `The ${specs.display} provides vibrant colors and sharp detail, making it excellent for both productivity and entertainment.` : 'The display offers a quality viewing experience.'}

### Camera System
${specs.camera ? `The camera system featuring ${specs.camera} delivers impressive results in various lighting conditions.` : 'The camera performs well for everyday photography needs.'}

## Real-World Usage

During our extensive testing period, we used this device in various scenarios to evaluate its real-world performance. The battery life proved to be ${specs.battery ? `reliable with ${specs.battery}` : 'adequate for daily use'}.

## Pros and Cons

### What We Loved
${pros ? pros.map((pro: string) => `- ${pro}`).join('\n') : '- Solid overall performance\n- Good build quality\n- User-friendly interface'}

### Areas for Improvement
${cons ? cons.map((con: string) => `- ${con}`).join('\n') : '- Price could be more competitive\n- Some features could be refined'}

## Value Proposition

At its current price point, the ${title} offers good value considering its feature set and build quality. While it may not be the cheapest option available, the combination of performance, design, and functionality justifies the investment for most users.

## Final Verdict

The ${title} earns a rating of ${rating || 4.2} out of 5 stars. It successfully delivers on its promises and provides a solid user experience. Whether you're a power user or someone looking for reliable daily performance, this device deserves serious consideration.

## Recommendation

We recommend the ${title} for users who prioritize quality and performance. While there are more budget-friendly alternatives available, the overall package here provides excellent long-term value.
  `.trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { productData, authorId, categoryId } = await req.json()

    // Generate review content
    const reviewContent = generateReviewContent(productData)
    
    // Create slug from title
    const slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Generate excerpt
    const excerpt = `In-depth review of the ${productData.title}, covering design, performance, camera quality, and overall value proposition.`

    // Calculate reading time (average 200 words per minute)
    const wordCount = reviewContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    // Insert content
    const { data: content, error: contentError } = await supabaseClient
      .from('content')
      .insert({
        title: `${productData.title} Review`,
        slug: slug,
        excerpt: excerpt,
        content: reviewContent,
        content_type: 'review',
        status: 'published',
        author_id: authorId,
        category_id: categoryId,
        featured_image: productData.images?.[0] || null,
        reading_time: readingTime,
        published_at: new Date().toISOString(),
        is_featured: Math.random() > 0.7 // 30% chance of being featured
      })
      .select()
      .single()

    if (contentError) throw contentError

    // Insert review details
    const { error: reviewError } = await supabaseClient
      .from('review_details')
      .insert({
        content_id: content.id,
        product_name: productData.title,
        brand: productData.title.split(' ')[0], // Extract brand from title
        overall_rating: productData.rating || 4.2,
        price: productData.price,
        pros: productData.pros || [],
        cons: productData.cons || [],
        images: productData.images || [],
        specifications: productData.specs || {}
      })

    if (reviewError) throw reviewError

    // Insert product specifications
    if (productData.specs) {
      const specs = Object.entries(productData.specs).map(([key, value], index) => ({
        content_id: content.id,
        spec_category: 'general',
        spec_name: key,
        spec_value: String(value),
        display_order: index
      }))

      const { error: specsError } = await supabaseClient
        .from('product_specs')
        .insert(specs)

      if (specsError) throw specsError
    }

    return new Response(
      JSON.stringify({
        success: true,
        content_id: content.id,
        message: 'Review generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating review:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
