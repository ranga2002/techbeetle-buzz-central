
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile data:', data);
      return data;
    },
    enabled: !!user?.id && !authLoading,
  });

  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'editor';
  const isAuthor = profile?.role === 'author';
  const hasAdminAccess = ['admin', 'editor'].includes(profile?.role || '');
  const hasContentAccess = ['admin', 'editor', 'author'].includes(profile?.role || '');

  console.log('Admin auth state:', {
    user: !!user,
    profile,
    isAdmin,
    isEditor,
    isAuthor,
    hasAdminAccess,
    hasContentAccess,
    isLoading: isLoading || authLoading
  });

  return {
    user,
    profile,
    isLoading: isLoading || authLoading,
    isAdmin,
    isEditor,
    isAuthor,
    hasAdminAccess,
    hasContentAccess,
  };
};
