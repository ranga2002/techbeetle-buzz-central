import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Content = Tables<'content'> & {
  categories?: Tables<'categories'>;
};

export const useTrendingArticles = () => {
  const fetchTrending = async (): Promise<Content[]> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        categories(*)
      `)
      .eq('status', 'published')
      .in('content_type', ['review', 'video', 'how_to', 'comparison'])
      .gte('published_at', oneWeekAgo.toISOString())
      .order('views_count', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  };

  return useQuery({
    queryKey: ['trending-articles'],
    queryFn: fetchTrending,
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
};
