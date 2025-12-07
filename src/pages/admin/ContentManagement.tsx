
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ContentFilters from '@/components/admin/content/ContentFilters';
import ContentTable from '@/components/admin/content/ContentTable';
import type { Tables, Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';

type Content = Tables<'content'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name'> | null;
  categories: Pick<Tables<'categories'>, 'name'> | null;
};

type ContentStatus = Database['public']['Enums']['content_status'];
type ContentType = Database['public']['Enums']['content_type'];

const ContentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content', searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('content')
        .select(`
          *,
          profiles:author_id (full_name),
          categories (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ContentStatus);
      }
      if (typeFilter !== 'all') {
        query = query.eq('content_type', typeFilter as ContentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Content[];
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({
        title: "Content deleted",
        description: "The content has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ contentId, status }: { contentId: string; status: ContentStatus }) => {
      const { error } = await supabase
        .from('content')
        .update({ 
          status: status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', contentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({
        title: "Status updated",
        description: "Content status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update content status.",
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
        <h1 className="text-3xl font-bold">Content Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Content
        </Button>
      </div>

      <ContentFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      <Card>
        <CardContent className="p-0">
          <ContentTable
            content={content}
            onStatusUpdate={(contentId, status) => 
              updateStatusMutation.mutate({ contentId, status })
            }
            onDelete={(contentId) => {
              if (window.confirm("Delete this content? This cannot be undone.")) {
                deleteContentMutation.mutate(contentId);
              }
            }}
            onEdit={(contentId, type) => {
              if (type === 'review') {
                navigate(`/admin/product-management?edit=${contentId}`);
              } else {
                toast({
                  title: 'Edit not available',
                  description: 'Editing is currently only supported for reviews.',
                  variant: 'destructive',
                });
              }
            }}
            onView={(slug, type) => {
              if (!slug) return;
              const typeToRoute: Record<string, string> = {
                review: '/reviews',
                news: '/news',
                article: '/news',
                how_to: '/how-to',
                comparison: '/compare',
                video: '/videos',
              };
              const base = typeToRoute[type || ''] || '/news';
              window.open(`${base}/${slug}`, '_blank');
            }}
            isUpdating={updateStatusMutation.isPending}
            isDeleting={deleteContentMutation.isPending}
          />
      </CardContent>
    </Card>
    </div>
  );
};

export default ContentManagement;
