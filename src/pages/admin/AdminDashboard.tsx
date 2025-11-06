
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
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
      bgColor: 'bg-gradient-to-br from-green-500/10 to-green-600/10',
      iconColor: 'text-green-600',
    },
    {
      title: 'Comments',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      description: `${stats?.pendingComments || 0} pending approval`,
      bgColor: 'bg-gradient-to-br from-orange-500/10 to-orange-600/10',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: Eye,
      description: 'All time views',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/10',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`border-0 shadow-sm ${stat.bgColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Content */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Recent Content</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentContent && recentContent.length > 0 ? (
            <div className="space-y-3">
              {recentContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-card">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{content.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {content.profiles?.full_name || 'Unknown'} • {new Date(content.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-4 ${
                    content.status === 'published' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : content.status === 'draft'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {content.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No content yet. Create your first piece of content!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
