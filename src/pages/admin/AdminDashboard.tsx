
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, MessageSquare, Eye, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [contentResult, usersResult, commentsResult, viewsResult] = await Promise.all([
        supabase
          .from('content')
          .select('id, status')
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
        supabase
          .from('profiles')
          .select('id, role, created_at')
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
        supabase
          .from('comments')
          .select('id, status')
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
        supabase
          .from('content')
          .select('views_count')
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
      ]);

      const totalContent = contentResult.length;
      const publishedContent = contentResult.filter(c => c.status === 'published').length;
      const draftContent = contentResult.filter(c => c.status === 'draft').length;
      const pendingContent = contentResult.filter(c => c.status === 'pending').length;

      const totalUsers = usersResult.length;
      const totalComments = commentsResult.length;
      const pendingComments = commentsResult.filter(c => c.status === 'pending').length;
      
      const totalViews = viewsResult.reduce((sum, item) => sum + (item.views_count || 0), 0);

      return {
        totalContent,
        publishedContent,
        draftContent,
        pendingContent,
        totalUsers,
        totalComments,
        pendingComments,
        totalViews,
      };
    },
  });

  const { data: recentContent, isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          title,
          status,
          created_at,
          profiles:author_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Content',
      value: stats?.totalContent || 0,
      icon: FileText,
      description: `${stats?.publishedContent || 0} published, ${stats?.draftContent || 0} draft`,
      color: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
      color: 'text-green-600',
    },
    {
      title: 'Comments',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      description: `${stats?.pendingComments || 0} pending approval`,
      color: 'text-orange-600',
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: Eye,
      description: 'All time views',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentContent?.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{content.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {content.profiles?.full_name || 'Unknown'} • {new Date(content.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    content.status === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : content.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {content.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
