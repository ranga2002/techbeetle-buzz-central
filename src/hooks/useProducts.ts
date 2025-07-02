
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type ProductContent = Tables<'content'> & {
  categories?: Tables<'categories'>;
  profiles?: Tables<'profiles'>;
  review_details?: Tables<'review_details'>[];
  purchase_links?: Tables<'purchase_links'>[];
  product_specs?: Tables<'product_specs'>[];
};

export const useProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchProductReviews = async (filters?: {
    category?: string;
    minRating?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<ProductContent[]> => {
    let query = supabase
      .from('content')
      .select(`
        *,
        categories(*),
        profiles(*),
        review_details(*),
        purchase_links(*),
        product_specs(*)
      `)
      .eq('content_type', 'review')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('categories.slug', filters.category);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Apply post-processing filters
    let results = data || [];
    
    if (filters?.minRating) {
      results = results.filter(item => 
        item.review_details?.[0]?.overall_rating >= filters.minRating!
      );
    }
    
    if (filters?.maxPrice) {
      results = results.filter(item => 
        item.review_details?.[0]?.price <= filters.maxPrice!
      );
    }

    return results;
  };

  const fetchProductSpecs = async (contentId: string) => {
    const { data, error } = await supabase
      .from('product_specs')
      .select('*')
      .eq('content_id', contentId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  };

  const fetchPurchaseLinks = async (contentId: string) => {
    const { data, error } = await supabase
      .from('purchase_links')
      .select('*')
      .eq('content_id', contentId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const generateProductReview = useMutation({
    mutationFn: async ({ productId, sourceType = 'amazon' }: {
      productId: string;
      sourceType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('scrape-product-data', {
        body: { product_id: productId, source_type: sourceType }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast({
        title: "Product Review Generated",
        description: "Successfully created comprehensive product review",
      });
    },
  });

  return {
    useProductReviewsQuery: (filters?: Parameters<typeof fetchProductReviews>[0]) =>
      useQuery({
        queryKey: ['product-reviews', filters],
        queryFn: () => fetchProductReviews(filters),
      }),
    
    useProductSpecsQuery: (contentId: string) =>
      useQuery({
        queryKey: ['product-specs', contentId],
        queryFn: () => fetchProductSpecs(contentId),
        enabled: !!contentId,
      }),
    
    usePurchaseLinksQuery: (contentId: string) =>
      useQuery({
        queryKey: ['purchase-links', contentId],
        queryFn: () => fetchPurchaseLinks(contentId),
        enabled: !!contentId,
      }),
    
    generateProductReview,
  };
};
