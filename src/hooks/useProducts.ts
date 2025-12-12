
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type ProductContent = Tables<'content'> & {
  categories?: Tables<'categories'>;
  profiles?: Tables<'profiles'>;
  purchase_links?: Tables<'purchase_links'>[];
  inventory?: {
    id: string;
    price?: number | null;
    images?: string[] | null;
    affiliate_url?: string | null;
    source_url?: string | null;
    specs?: Record<string, unknown> | null;
  } | null;
};

export const useProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchProducts = async (filters?: {
    category?: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<ProductContent[]> => {
    let query = supabase
      .from('content')
      .select(`
        *,
        categories(*),
        profiles(*),
        purchase_links(*),
        inventory:inventory_id (*)
      `)
      .eq('content_type', 'product')
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

    let results = data || [];
    if (filters?.maxPrice) {
      results = results.filter((item) => {
        const primaryPrice =
          item.purchase_links?.find((link) => link.is_primary)?.price ?? item.inventory?.price ?? null;
        return primaryPrice === null ? true : primaryPrice <= filters.maxPrice!;
      });
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
    useProductCatalogQuery: (filters?: Parameters<typeof fetchProducts>[0]) =>
      useQuery({
        queryKey: ['product-catalog', filters],
        queryFn: () => fetchProducts(filters),
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
