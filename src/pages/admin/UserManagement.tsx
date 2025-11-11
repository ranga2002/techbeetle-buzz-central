
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

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      // Fetch profiles with their roles from user_roles table
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        profileQuery = profileQuery.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      const { data: profiles, error: profilesError } = await profileQuery;
      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .in('user_id', userIds);

      // Merge profiles with their roles
      const usersWithRoles = profiles?.map(profile => {
        const userRoles = (roles as any[])?.filter((r: any) => r.user_id === profile.id) || [];
        const primaryRole = userRoles.find((r: any) => ['admin', 'editor', 'author'].includes(r.role))?.role || 'user';
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
      // Delete existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles' as any)
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles' as any)
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;
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
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);
      
      if (error) throw error;
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
            onStatusToggle={(userId, isActive) => 
              toggleUserStatusMutation.mutate({ userId, isActive })
            }
            isUpdating={updateRoleMutation.isPending || toggleUserStatusMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
