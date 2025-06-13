
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CommentTable from '@/components/admin/comments/CommentTable';
import type { Tables, Database } from '@/integrations/supabase/types';

type Comment = Tables<'comments'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name'> | null;
  content: Pick<Tables<'content'>, 'title'> | null;
};

type CommentStatus = Database['public']['Enums']['comment_status'];

const CommentsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['admin-comments', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (full_name),
          content:content_id (title)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('comment_text', `%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as CommentStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Comment[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: CommentStatus }) => {
      const { error } = await supabase
        .from('comments')
        .update({ status: status })
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      toast({
        title: "Comment status updated",
        description: "Comment status has been updated successfully.",
      });
    },
  });

  const delete CommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      toast({
        title: "Comment deleted",
        description: "Comment has been deleted successfully.",
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
        <h1 className="text-3xl font-bold">Comments Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <CommentTable
            comments={comments}
            onStatusUpdate={(commentId, status) => 
              updateStatusMutation.mutate({ commentId, status })
            }
            onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
            isUpdating={updateStatusMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsManagement;
