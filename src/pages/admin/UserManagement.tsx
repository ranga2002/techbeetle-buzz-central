
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UserFilters from '@/components/admin/users/UserFilters';
import UserTable from '@/components/admin/users/UserTable';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileWithEmail = ProfileRow & { email?: string | null };
type AdminUser = ProfileRow & { email?: string | null };
type UserRoleRow = { user_id: string; role: UserRole | null };

const enableProfileEmailSelect =
  import.meta.env.VITE_ENABLE_PROFILE_EMAIL === undefined
    ? true
    : import.meta.env.VITE_ENABLE_PROFILE_EMAIL === 'true';
let canSelectProfileEmail = enableProfileEmailSelect;

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      const baseSelect = 'id, full_name, username, created_at, is_active, role';
      const profileSelectWithEmail = `${baseSelect}, email`;

      try {
        // Fetch profiles with their roles from user_roles table + profiles.role
        // Attempt to pull email from profiles.email if present (fallback to no email)
        let profileQuery = supabase
          .from('profiles')
          .select(canSelectProfileEmail ? profileSelectWithEmail : baseSelect)
          .order('created_at', { ascending: false })
          .limit(200);

        if (searchTerm) {
          profileQuery = profileQuery.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
        }

        let baseProfiles: ProfileWithEmail[] = [];

        if (canSelectProfileEmail) {
          const { data: profiles, error: profilesError } = await profileQuery;
          if (profilesError) {
            canSelectProfileEmail = false;
            console.warn('Email column not available on profiles; falling back without email', profilesError.message || profilesError);
          } else {
            baseProfiles = (profiles || []) as ProfileWithEmail[];
          }
        }

        if (!baseProfiles.length) {
          const { data: fallbackProfiles, error: fallbackError } = await supabase
            .from('profiles')
            .select(baseSelect)
            .order('created_at', { ascending: false })
            .limit(200);

          if (fallbackError) throw fallbackError;
          baseProfiles = (fallbackProfiles || []) as ProfileWithEmail[];
        }

        const profilesWithEmail = baseProfiles.map((profile) => ({
          ...profile,
          email: profile.email ?? null,
        })) as AdminUser[];

        // Fetch roles for each user
        const userIds = profilesWithEmail.map(p => p.id);
        const { data: roles, error: rolesError } = userIds.length
          ? await supabase
              .from<UserRoleRow>('user_roles')
              .select('user_id, role')
              .in('user_id', userIds)
          : { data: [], error: null };
        if (rolesError) throw rolesError;

        // Merge profiles with their roles (prefer profile.role, then user_roles)
        const priority: UserRole[] = ['admin', 'editor', 'author', 'user'];
        const usersWithRoles: AdminUser[] = profilesWithEmail.map(profile => {
          const userRoles = (roles || []).filter((r) => r.user_id === profile.id);
          const primaryRole =
            (profile.role as UserRole | null) ||
            (priority.find(r => userRoles.some((ur) => ur.role === r)) as UserRole | undefined) ||
            'user';
          return {
            ...profile,
            role: primaryRole,
          };
        });

        // Apply role filter
        if (roleFilter !== 'all') {
          return usersWithRoles.filter(u => u.role === roleFilter);
        }

        return usersWithRoles;
      } catch (err: any) {
        if (err?.code === '42P17') {
          toast({
            title: 'Profiles policy recursion',
            description: 'The profiles RLS policy is recursive. Please fix the backend policy and retry.',
            variant: 'destructive',
          });
          throw new Error('Profiles RLS policy recursion detected; backend change required.');
        }
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // Keep profiles.role and user_roles in sync
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      if (profileError) throw profileError;

      // Ensure single role row per user via upsert
      const { error: roleError } = await supabase
        .from('user_roles' as any)
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive, reason, email }: { userId: string; isActive: boolean; reason?: string; email?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);
      
      if (error) throw error;

      if (email) {
        try {
          await supabase.functions.invoke('send-suspension-email', {
            body: { userId, email, reason, action: isActive ? 'suspend' : 'activate' }
          });
        } catch (err) {
          console.error('Failed to send suspension email', err);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "User status updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users.';
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Could not load users</AlertTitle>
          <AlertDescription>
            {message} If this mentions profiles policy recursion (code 42P17), update the profiles RLS policy on Supabase and retry.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <UserFilters
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        onSearchChange={setSearchTerm}
        onRoleChange={setRoleFilter}
      />

      <Card>
        <CardContent className="p-0">
          <UserTable
            users={users}
            onRoleUpdate={(userId, role) => 
              updateRoleMutation.mutate({ userId, role })
            }
            onStatusToggle={({ userId, isActive, reason, email }) => 
              toggleUserStatusMutation.mutate({ userId, isActive, reason, email })
            }
            isUpdating={updateRoleMutation.isPending || toggleUserStatusMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
