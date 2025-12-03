
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Content = Tables<'content'> & {
  categories?: Tables<'categories'>;
  profiles?: Tables<'profiles'>;
};
type Category = Tables<'categories'>;

export const useContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchContent = async (filters?: {
    category?: string;
    contentType?: string;
    status?: string;
    limit?: number;
    slug?: string;
  }): Promise<Content[]> => {
    let query = supabase
      .from('content')
      .select(`
        *,
        categories(*),
        profiles(*)
      `)
      .order('published_at', { ascending: false });

    if (filters?.slug) {
      query = query.eq('slug', filters.slug);
    }
    if (filters?.category) {
      // Resolve category slug to id to ensure reliable filtering
      const { data: categoryLookup } = await supabase
        .from('categories')
        .select('id, slug')
        .eq('slug', filters.category)
        .maybeSingle();

      if (categoryLookup?.id) {
        query = query.eq('category_id', categoryLookup.id);
      } else {
        // Fallback to attempting relational filter if slug resolution fails
        query = query.eq('categories.slug', filters.category);
      }
    }
    if (filters?.contentType) {
      query = query.eq('content_type', filters.contentType as any);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as any);
    } else {
      query = query.eq('status', 'published');
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  };

  const fetchFeaturedContent = async (): Promise<Content[]> => {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        categories(*),
        profiles(*)
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  };

  const incrementViews = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase.rpc('increment_content_views', {
        content_id_param: contentId
      });
      if (error) throw error;
    },
  });

  return {
    useContentQuery: (
      filters?: Parameters<typeof fetchContent>[0],
      options?: {
        refetchInterval?: number;
        staleTime?: number;
        refetchOnWindowFocus?: boolean;
      },
    ) =>
      useQuery({
        queryKey: ['content', filters],
        queryFn: () => fetchContent(filters),
        staleTime: options?.staleTime ?? 60_000,
        refetchInterval: options?.refetchInterval,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      }),
    
    useCategoriesQuery: () =>
      useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
      }),
    
    useFeaturedContentQuery: () =>
      useQuery({
        queryKey: ['featured-content'],
        queryFn: fetchFeaturedContent,
      }),
    
    incrementViews,
  };
};
