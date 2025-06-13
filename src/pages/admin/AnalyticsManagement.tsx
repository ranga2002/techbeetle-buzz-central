
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Eye, Users, MessageSquare, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AnalyticsManagement = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [contentViews, userStats, commentStats, topContent] = await Promise.all([
        supabase
          .from('analytics')
          .select('created_at, content_id, content(*)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('profiles')
          .select('created_at, role')
          .order('created_at', { ascending: false }),
        supabase
          .from('comments')
          .select('created_at, status')
          .order('created_at', { ascending: false }),
        supabase
          .from('content')
          .select('title, views_count')
          .order('views_count', { ascending: false })
          .limit(10)
      ]);

      return {
        contentViews: contentViews.data || [],
        userStats: userStats.data || [],
        commentStats: commentStats.data || [],
        topContent: topContent.data || [],
      };
    },
  });

  const { data: totalStats } = useQuery({
    queryKey: ['admin-total-stats'],
    queryFn: async () => {
      const [totalUsers, totalContent, totalComments, totalViews] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('content').select('id', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact' }),
        supabase.from('content').select('views_count').then(({ data }) => 
          data?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0
        )
      ]);

      return {
        totalUsers: totalUsers.count || 0,
        totalContent: totalContent.count || 0,
        totalComments: totalComments.count || 0,
        totalViews,
      };
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: totalStats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Content',
      value: totalStats?.totalContent || 0,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Total Comments',
      value: totalStats?.totalComments || 0,
      icon: MessageSquare,
      color: 'text-orange-600',
    },
    {
      title: 'Total Views',
      value: totalStats?.totalViews || 0,
      icon: Eye,
      color: 'text-purple-600',
    },
  ];

  // Process data for charts
  const viewsData = analytics?.contentViews?.reduce((acc: any[], view) => {
    const date = new Date(view.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.views += 1;
    } else {
      acc.push({ date, views: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Content by Views</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.topContent || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views_count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsManagement;
