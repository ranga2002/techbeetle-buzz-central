
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Eye, Users, MessageSquare, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AnalyticsManagement = () => {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [appliedDateRange, setAppliedDateRange] = useState(30);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [appliedCompareEnabled, setAppliedCompareEnabled] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [appliedContentType, setAppliedContentType] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [appliedCategory, setAppliedCategory] = useState('all');
  const [customDays, setCustomDays] = useState('');

  const { data: analytics, isLoading, error: analyticsError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [contentViews, userStats, commentStats, contentCatalog] = await Promise.all([
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
          .select('id, title, views_count, content_type, category_id, author_id, categories ( name )')
          .order('views_count', { ascending: false })
          .limit(200)
      ]);

      return {
        contentViews: contentViews.data || [],
        userStats: userStats.data || [],
        commentStats: commentStats.data || [],
        contentCatalog: contentCatalog.data || [],
      };
    },
  });

  const { data: totalStats, error: totalsError } = useQuery({
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

  useEffect(() => {
    const channel = supabase.channel('admin-analytics-live');
    const tables = ['analytics', 'content', 'comments', 'profiles'];
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-total-stats'] });
    };

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        invalidate
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        setRealtimeStatus('error');
      }
      if (status === 'SUBSCRIBING') setRealtimeStatus('connecting');
    });

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - appliedDateRange);
    return d;
  }, [appliedDateRange]);

  const prevStartDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - appliedDateRange);
    return d;
  }, [startDate, appliedDateRange]);

  const contentTypes = useMemo(
    () => ['all', ...Array.from(new Set(analytics?.contentCatalog?.map((c: any) => c.content_type) || []))],
    [analytics?.contentCatalog]
  );

  const categories = useMemo(
    () => {
      const unique = new Map<string, string>();
      (analytics?.contentCatalog || []).forEach((c: any) => {
        if (c.category_id && c.categories?.name) unique.set(c.category_id, c.categories.name);
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    },
    [analytics?.contentCatalog]
  );

  const filteredContentCatalog = useMemo(() => {
    return (analytics?.contentCatalog || []).filter((c: any) => {
      const typeOk = appliedContentType === 'all' || c.content_type === appliedContentType;
      const categoryOk = appliedCategory === 'all' || c.category_id === appliedCategory;
      return typeOk && categoryOk;
    });
  }, [analytics?.contentCatalog, appliedContentType, appliedCategory]);

  const filteredViews = useMemo(() => {
    return (analytics?.contentViews || []).filter((view: any) => {
      const createdAt = new Date(view.created_at);
      if (createdAt < startDate) return false;
      const contentMeta = filteredContentCatalog.find((c: any) => c.id === view.content_id);
      if (!contentMeta && (appliedContentType !== 'all' || appliedCategory !== 'all')) return false;
      return true;
    });
  }, [analytics?.contentViews, startDate, filteredContentCatalog, appliedContentType, appliedCategory]);

  const filteredComments = useMemo(() => {
    return (analytics?.commentStats || []).filter((comment: any) => {
      const createdAt = new Date(comment.created_at);
      if (createdAt < startDate) return false;
      // if content filters are applied, include only comments on matching content
      if (appliedContentType === 'all' && appliedCategory === 'all') return true;
      const contentMeta = filteredContentCatalog.find((c: any) => c.id === comment.content_id);
      return !!contentMeta;
    });
  }, [analytics?.commentStats, startDate, filteredContentCatalog, appliedContentType, appliedCategory]);

  const previousViews = useMemo(() => {
    return (analytics?.contentViews || []).filter((view: any) => {
      const createdAt = new Date(view.created_at);
      return createdAt >= prevStartDate && createdAt < startDate;
    });
  }, [analytics?.contentViews, prevStartDate, startDate]);

  const viewsData = useMemo(() => {
    return filteredViews.reduce((acc: any[], view: any) => {
      const date = new Date(view.created_at).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.views += 1;
      } else {
        acc.push({ date, views: 1 });
      }
      return acc;
    }, []);
  }, [filteredViews]);

  const engagementData = useMemo(() => {
    const map: Record<string, { date: string; views: number; comments: number }> = {};
    filteredViews.forEach((view: any) => {
      const date = new Date(view.created_at).toLocaleDateString();
      map[date] = map[date] || { date, views: 0, comments: 0 };
      map[date].views += 1;
    });
    filteredComments.forEach((comment: any) => {
      const createdAt = new Date(comment.created_at);
      const date = createdAt.toLocaleDateString();
      map[date] = map[date] || { date, views: 0, comments: 0 };
      map[date].comments += 1;
    });
    return Object.values(map).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredViews, filteredComments]);

  const topContent = useMemo(() => {
    const viewCounts = filteredViews.reduce((acc: Record<string, number>, view: any) => {
      const id = view.content_id;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    return filteredContentCatalog
      .map((c: any) => ({
        ...c,
        live_views: viewCounts[c.id] || 0,
      }))
      .sort((a, b) => (b.live_views || 0) - (a.live_views || 0))
      .slice(0, 10);
  }, [filteredContentCatalog, filteredViews]);

  const totalViewsCurrent = filteredViews.length || 0;
  const totalViewsPrev = previousViews.length || 0;
  const viewsDelta = appliedCompareEnabled && totalViewsPrev > 0
    ? Math.round(((totalViewsCurrent - totalViewsPrev) / totalViewsPrev) * 100)
    : null;

  const applyFilters = (overrideRange?: number) => {
    if (overrideRange) {
      setAppliedDateRange(overrideRange);
      setDateRangeDays(overrideRange);
    } else {
      setAppliedDateRange(dateRangeDays);
    }
    setAppliedContentType(contentTypeFilter);
    setAppliedCategory(categoryFilter);
    setAppliedCompareEnabled(compareEnabled);
  };

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

  if (analyticsError || totalsError) {
    const message = analyticsError?.message || totalsError?.message || 'Unable to load analytics data.';
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
        {message}
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
      title: 'Views (range)',
      value: totalViewsCurrent,
      icon: Eye,
      color: 'text-purple-600',
      delta: viewsDelta,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              realtimeStatus === 'connected'
                ? 'bg-emerald-500'
                : realtimeStatus === 'connecting'
                ? 'bg-amber-500'
                : 'bg-destructive'
            }`}
          />
          <Badge variant="outline">
            {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting…' : 'Offline'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Date range</p>
            <Select
              value={String(dateRangeDays)}
              onValueChange={(val) => {
                const n = Number(val);
                setDateRangeDays(n);
                setCustomDays('');
                applyFilters(n);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Custom days"
                type="number"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const n = Number(customDays);
                  if (!Number.isNaN(n) && n > 0) {
                    setDateRangeDays(n);
                    setCustomDays('');
                    applyFilters(n);
                  }
                }}
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Compare to previous</p>
            <div className="flex items-center gap-2">
              <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} id="compare-toggle" />
              <label htmlFor="compare-toggle" className="text-sm text-muted-foreground">Enable compare</label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Content type</p>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type === 'all' ? 'All types' : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Category</p>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ['Title', 'Views', 'Content Type', 'Category'];
                const rows = topContent.map((item) => [
                  `"${item.title.replace(/\"/g, '""')}"`,
                  item.live_views || 0,
                  item.content_type || '',
                  item.categories?.name || ''
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'analytics-top-content.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const summary = [
                  `Analytics snapshot (last ${appliedDateRange} days)`,
                  `Views: ${totalViewsCurrent}`,
                  `Comments: ${filteredComments.length}`,
                  `Users: ${totalStats?.totalUsers || 0}`,
                  `Content pieces: ${filteredContentCatalog.length}`,
                  '',
                  'Top content:',
                  ...topContent.map((item, idx) => `${idx + 1}. ${item.title} — ${item.live_views || 0} views`),
                ].join('\\n');
                const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'analytics-snapshot.txt');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download snapshot
            </Button>
            <Button size="sm" onClick={() => applyFilters()}>
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
                {stat.delta !== undefined && stat.delta !== null && (
                  <p className={`text-xs mt-1 ${stat.delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {stat.delta >= 0 ? '+' : ''}{stat.delta}% vs prev
                  </p>
                )}
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
              <BarChart data={topContent || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="live_views" name="Views (range)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement (Views vs Comments)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#6366f1" />
                <Line type="monotone" dataKey="comments" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Views (range)</span>
              <span className="font-semibold">{totalViewsCurrent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Comments</span>
              <span className="font-semibold">{filteredComments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Content pieces</span>
              <span className="font-semibold">{filteredContentCatalog.length}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Drop-off is approximate based on available events in the selected range.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No source data available yet. Connect referrer/device logging to populate this panel.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error & Latency Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Supabase status</span>
              <Badge variant="outline">{analyticsError || totalsError ? 'Check' : 'Healthy'}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">Hook this up to API logs/uptime checks for deeper insight.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsManagement;
