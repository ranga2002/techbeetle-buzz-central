import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      
      // Fetch user's roles from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id);
      
      // Get profile data (may include role)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, role')
        .eq('id', user.id)
        .single();
      
      if (rolesError && !profile?.role) {
        throw rolesError;
      }
      
      // Determine highest priority role from user_roles + profile.role fallback
      const roleMap = (roles as any[])?.map((r: any) => r.role) || [];
      if (profile?.role) roleMap.push(profile.role);
      const uniqueRoles = Array.from(new Set(roleMap));
      const role = uniqueRoles.includes('admin') ? 'admin' 
        : uniqueRoles.includes('editor') ? 'editor'
        : uniqueRoles.includes('author') ? 'author'
        : 'user';
      
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
