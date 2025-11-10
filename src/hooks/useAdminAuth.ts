
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      
      console.log('Fetching roles for user:', user.id);
      
      // Fetch user's roles from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        throw rolesError;
      }
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }
      
      // Determine highest priority role
      const roleMap = roles?.map(r => r.role) || [];
      const role = roleMap.includes('admin') ? 'admin' 
        : roleMap.includes('editor') ? 'editor'
        : roleMap.includes('author') ? 'author'
        : 'user';
      
      console.log('User roles:', roleMap, 'Highest:', role);
      return { role, full_name: profile?.full_name, username: profile?.username };
    },
    enabled: !!user?.id && !authLoading,
    retry: 1,
  });

  const isAdmin = userRole?.role === 'admin';
  const isEditor = userRole?.role === 'editor';
  const isAuthor = userRole?.role === 'author';
  const hasAdminAccess = ['admin', 'editor'].includes(userRole?.role || '');
  const hasContentAccess = ['admin', 'editor', 'author'].includes(userRole?.role || '');

  console.log('Admin auth state:', {
    user: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole,
    roleError: error,
    isAdmin,
    isEditor,
    isAuthor,
    hasAdminAccess,
    hasContentAccess,
    isLoading: isLoading || authLoading,
    authLoading,
    roleLoading: isLoading
  });

  return {
    user,
    profile: userRole,
    isLoading: isLoading || authLoading,
    error,
    isAdmin,
    isEditor,
    isAuthor,
    hasAdminAccess,
    hasContentAccess,
  };
};
