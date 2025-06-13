
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Check, X, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

  const deleteCommentMutation = useMutation({
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

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

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

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Comments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

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

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments?.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{comment.comment_text}</p>
                      </TableCell>
                      <TableCell>{comment.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{comment.content?.title || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(comment.status || 'pending')}>
                          {comment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(comment.created_at || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => 
                              updateStatusMutation.mutate({ 
                                commentId: comment.id, 
                                status: 'approved' as CommentStatus 
                              })
                            }
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => 
                              updateStatusMutation.mutate({ 
                                commentId: comment.id, 
                                status: 'rejected' as CommentStatus 
                              })
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommentsManagement;
