
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { FileText, Users, MessageSquare, Eye, TrendingUp, Plus, ShieldCheck, Activity, Server, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { profile, hasContentAccess } = useAdminAuth();
  const { data: stats, isLoading, error: statsError } = useQuery({
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

  const { data: recentContent, isLoading: loadingRecent, error: recentError } = useQuery({
    queryKey: ['recent-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          title,
          status,
          slug,
          content_type,
          created_at,
          profiles:author_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const healthCards = useMemo(() => {
    const queryError = statsError || recentError;
    const supabaseMessage = queryError?.message || 'Supabase reachable';
    const isRateLimited = supabaseMessage.toLowerCase().includes('429') || supabaseMessage.toLowerCase().includes('rate');

    return [
      {
        title: 'Access',
        message: hasContentAccess ? `Role checks active (${profile?.role || 'unknown'})` : 'Permissions limited',
        status: hasContentAccess ? 'ok' : 'warn',
        Icon: ShieldCheck,
      },
      {
        title: 'Queries',
        message: queryError ? 'Errors loading stats' : 'Live content & users',
        status: queryError ? 'error' : (isLoading || loadingRecent) ? 'warn' : 'ok',
        Icon: Activity,
      },
      {
        title: 'Supabase',
        message: queryError ? (isRateLimited ? 'Rate limit detected' : 'Check Supabase logs') : 'Healthy',
        status: queryError ? (isRateLimited ? 'warn' : 'error') : 'ok',
        Icon: Server,
      },
    ];
  }, [hasContentAccess, profile?.role, statsError, recentError, isLoading, loadingRecent]);

  const statusStyles: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warn: 'bg-amber-50 text-amber-800 border border-amber-100',
    error: 'bg-destructive/10 text-destructive border border-destructive/30',
  };

  const statCards = [
    {
      title: 'Total Content',
      value: stats?.totalContent || 0,
      icon: FileText,
      description: `${stats?.publishedContent || 0} published, ${stats?.draftContent || 0} draft`,
      accent: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Comments',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      description: `${stats?.pendingComments || 0} pending approval`,
      accent: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: Eye,
      description: 'All time views',
      accent: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Control room</p>
          <h1 className="text-3xl font-semibold">Admin overview</h1>
          <p className="text-muted-foreground mt-1">Monitor content velocity, users, and health signals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/admin/content"><Plus className="w-4 h-4 mr-2" />New content</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/users"><Users className="w-4 h-4 mr-2" />Manage users</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          Unable to load admin stats. {statsError.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${stat.accent}`}>
                      {stat.title}
                    </div>
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <span className="block h-full bg-primary/70 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm rounded-2xl">
          <CardHeader className="flex items-center justify-between border-b">
            <div>
              <CardTitle className="text-lg">Recent Content</CardTitle>
              <p className="text-sm text-muted-foreground">Latest 5 entries</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/content">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingRecent ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : recentError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                Unable to load recent content. {recentError.message}
              </div>
            ) : recentContent && recentContent.length > 0 ? (
              <div className="space-y-3">
                {recentContent.map((content) => {
                  const isReview = content.content_type === 'review';
                  const viewHref = isReview ? `/reviews/${content.slug}` : `/news/${content.slug}`;
                  return (
                    <Link
                      key={content.id}
                      to={viewHref}
                      className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow bg-card"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-base mb-1 line-clamp-1">{content.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          by {content.profiles?.full_name || 'Unknown'} • {new Date(content.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="capitalize">{content.status}</Badge>
                        <Badge variant="outline">{content.content_type}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No content yet. Create your first piece of content!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">System health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthCards.map((item) => {
                const Icon = item.Icon;
                return (
                  <div key={item.title} className={`flex items-center gap-3 p-3 rounded-lg ${statusStyles[item.status]}`}>
                    <Icon className="w-4 h-4" />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs">{item.message}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="secondary" className="w-full justify-between">
                <Link to="/admin/content">
                  Create article
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/admin/comments">
                  Review comments
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/admin/analytics">
                  Refresh metrics
                  <RefreshCw className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
