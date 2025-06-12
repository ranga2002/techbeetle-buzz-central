
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'editor';
  const isAuthor = profile?.role === 'author';
  const hasAdminAccess = ['admin', 'editor'].includes(profile?.role || '');
  const hasContentAccess = ['admin', 'editor', 'author'].includes(profile?.role || '');

  return {
    user,
    profile,
    isLoading,
    isAdmin,
    isEditor,
    isAuthor,
    hasAdminAccess,
    hasContentAccess,
  };
};
