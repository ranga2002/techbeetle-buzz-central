
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, ShieldOff } from 'lucide-react';
import type { Tables, Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserTableProps {
  users: Tables<'profiles'>[] | undefined;
  onRoleUpdate: (userId: string, role: UserRole) => void;
  onStatusToggle: (userId: string, isActive: boolean) => void;
  isUpdating: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onRoleUpdate,
  onStatusToggle,
  isUpdating,
}) => {
  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-red-100 text-red-800',
      editor: 'bg-blue-100 text-blue-800',
      author: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return variants[role as keyof typeof variants] || variants.user;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users?.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-medium">{user.full_name || 'No name'}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{user.username || 'No username'}</TableCell>
            <TableCell>
              <Select
                value={user.role || 'user'}
                onValueChange={(value) => 
                  onRoleUpdate(user.id, value as UserRole)
                }
                disabled={isUpdating}
              >
                <SelectTrigger className="w-32">
                  <Badge className={getRoleBadge(user.role || 'user')}>
                    {user.role}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(user.created_at || '').toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStatusToggle(user.id, user.is_active || false)}
                disabled={isUpdating}
              >
                {user.is_active ? (
                  <>
                    <ShieldOff className="w-4 h-4 mr-1" />
                    Suspend
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
