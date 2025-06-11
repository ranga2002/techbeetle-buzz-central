
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
  }): Promise<Content[]> => {
    let query = supabase
      .from('content')
      .select(`
        *,
        categories(name, slug, color),
        profiles(full_name, username, avatar_url)
      `)
      .order('published_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('categories.slug', filters.category);
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
        categories(name, slug, color),
        profiles(full_name, username, avatar_url)
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
    useContentQuery: (filters?: Parameters<typeof fetchContent>[0]) =>
      useQuery({
        queryKey: ['content', filters],
        queryFn: () => fetchContent(filters),
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
