
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import UserFilters from '@/components/admin/users/UserFilters';
import UserTable from '@/components/admin/users/UserTable';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      // Fetch profiles with their roles from user_roles table + profiles.role
      let profileQuery = supabase
        .from('profiles')
        .select('id, full_name, username, created_at, is_active, role')
        .order('created_at', { ascending: false })
        .limit(200);

      if (searchTerm) {
        profileQuery = profileQuery.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      const { data: profiles, error: profilesError } = await profileQuery;
      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .in('user_id', userIds);
      if (rolesError) throw rolesError;

      // Merge profiles with their roles (fallback to profile.role)
      const usersWithRoles = (profiles as ProfileRow[] | null)?.map(profile => {
        const userRoles = (roles as any[])?.filter((r: any) => r.user_id === profile.id) || [];
        const primaryRole = (userRoles.find((r: any) => ['admin', 'editor', 'author', 'user'].includes(r.role))?.role ||
          (profile.role as UserRole | null) ||
          'user') as UserRole;
        return {
          ...profile,
          role: primaryRole
        };
      }) || [];

      // Apply role filter
      if (roleFilter !== 'all') {
        return usersWithRoles.filter(u => u.role === roleFilter);
      }

      return usersWithRoles;
    },
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
