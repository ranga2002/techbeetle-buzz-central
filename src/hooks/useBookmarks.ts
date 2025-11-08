import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useBookmarks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          content_id,
          created_at,
          content:content_id (
            id,
            title,
            excerpt,
            featured_image,
            content_type,
            published_at,
            reading_time,
            slug,
            categories (*),
            profiles (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addBookmark = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, content_id: contentId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({
        title: "Bookmarked!",
        description: "Article saved to your bookmarks",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to bookmark article",
        variant: "destructive"
      });
    }
  });

  const removeBookmark = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({
        title: "Removed",
        description: "Article removed from bookmarks",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive"
      });
    }
  });

  const isBookmarked = (contentId: string) => {
    return bookmarks.some((b: any) => b.content_id === contentId);
  };

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
  };
};
