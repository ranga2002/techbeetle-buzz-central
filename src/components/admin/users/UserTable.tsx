
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

type UserRole = Database['public']['Enums']['user_role'];

interface UserTableProps {
  users: Tables<'profiles'>[] | undefined;
  onRoleUpdate: (userId: string, role: UserRole) => void;
  onStatusToggle: (args: { userId: string; isActive: boolean; reason?: string; email?: string }) => void;
  isUpdating: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onRoleUpdate,
  onStatusToggle,
  isUpdating,
}) => {
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

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
            <TableHead>Email</TableHead>
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
            <TableCell>{user.email || 'No email'}</TableCell>
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
                onClick={() => {
                  if (user.is_active) {
                    setSuspendUserId(user.id);
                  } else {
                    onStatusToggle({ userId: user.id, isActive: user.is_active || false, reason: 'Reactivated by admin', email: user.email || undefined });
                  }
                }}
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

      <AlertDialog open={!!suspendUserId} onOpenChange={(open) => {
        if (!open) {
          setSuspendUserId(null);
          setSuspendReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm suspension</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for suspending this user. An email notification will be attempted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Reason for suspension"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const user = users?.find(u => u.id === suspendUserId);
                onStatusToggle({
                  userId: suspendUserId || '',
                  isActive: user?.is_active || false,
                  reason: suspendReason || 'No reason provided',
                  email: user?.email || undefined,
                });
                setSuspendReason('');
                setSuspendUserId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Suspend user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  );
};

export default UserTable;
