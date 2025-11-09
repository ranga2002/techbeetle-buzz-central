import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Content = Tables<'content'> & {
  categories?: Tables<'categories'>;
};

export const useReadingHistory = (userId: string | undefined) => {
  const fetchReadingHistory = async (): Promise<Content[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('analytics')
      .select(`
        content_id,
        created_at,
        content:content_id (
          *,
          categories(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Extract unique content items
    const uniqueContent = new Map();
    data?.forEach(item => {
      if (item.content && !uniqueContent.has(item.content_id)) {
        uniqueContent.set(item.content_id, item.content);
      }
    });

    return Array.from(uniqueContent.values());
  };

  const fetchRecommendations = async (): Promise<Content[]> => {
    if (!userId) return [];

    // Get user's reading history categories
    const { data: history } = await supabase
      .from('analytics')
      .select(`
        content:content_id (
          category_id,
          categories(id, name)
        )
      `)
      .eq('user_id', userId)
      .limit(50);

    if (!history || history.length === 0) {
      // If no history, return popular content
      const { data: popular } = await supabase
        .from('content')
        .select(`
          *,
          categories(*)
        `)
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(6);

      return popular || [];
    }

    // Count category frequency
    const categoryCount: Record<string, number> = {};
    history.forEach(item => {
      const categoryId = item.content?.category_id;
      if (categoryId) {
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
      }
    });

    // Get top categories
    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    if (topCategories.length === 0) return [];

    // Get read content IDs to exclude
    const readContentIds = history
      .map(item => item.content?.category_id)
      .filter(Boolean);

    // Fetch recommendations from user's preferred categories
    const { data: recommendations, error } = await supabase
      .from('content')
      .select(`
        *,
        categories(*)
      `)
      .eq('status', 'published')
      .in('category_id', topCategories)
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return recommendations || [];
  };

  return {
    useReadingHistoryQuery: () =>
      useQuery({
        queryKey: ['reading-history', userId],
        queryFn: fetchReadingHistory,
        enabled: !!userId,
      }),
    useRecommendationsQuery: () =>
      useQuery({
        queryKey: ['recommendations', userId],
        queryFn: fetchRecommendations,
        enabled: !!userId,
      }),
  };
};
