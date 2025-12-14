import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type UserRoleRow = { role: UserRole | null };

const ROLE_PRIORITY: UserRole[] = ['admin', 'editor', 'author', 'user'];

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      // Prefer server-side role resolver to avoid profile policy recursion
      const { data: rpcRole, error: rpcError } = await supabase.rpc<UserRole>('get_current_user_role');

      // Also look at user_roles table for any explicit mappings
      const { data: roles, error: rolesError } = await supabase
        .from<UserRoleRow>('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rpcError && rolesError) {
        throw rpcError || rolesError;
      }

      const userRoles: UserRole[] = [];
      if (rpcRole) userRoles.push(rpcRole as UserRole);
      if (roles?.length) {
        userRoles.push(
          ...roles
            .map((r: { role: UserRole | null }) => r.role)
            .filter((r): r is UserRole => Boolean(r))
        );
      }

      const role = ROLE_PRIORITY.find(r => userRoles.includes(r)) || 'user';

      // Pull display info from auth metadata to avoid touching profiles table
      const full_name =
        (user.user_metadata as Record<string, string | undefined>)?.full_name ||
        (user.user_metadata as Record<string, string | undefined>)?.name ||
        user.email ||
        'User';
      const username =
        (user.user_metadata as Record<string, string | undefined>)?.username ||
        (user.user_metadata as Record<string, string | undefined>)?.preferred_username ||
        undefined;

      return { role, full_name, username };
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
