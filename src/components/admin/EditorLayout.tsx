import React, { useMemo, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  FolderOpen,
  Tags,
  Package,
  PenSquare,
  Settings,
  Shield,
  Menu,
  LogOut,
} from 'lucide-react';

const EditorLayout = () => {
  const { signOut } = useAuth();
  const { profile, isLoading, error, user } = useAdminAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const role = profile?.role || 'user';
  const isEditor = role === 'editor' || role === 'admin';

  const navSections = useMemo(
    () => [
      {
        title: 'Overview',
        items: [
          { path: '/editor', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/editor/analytics', label: 'Analytics', icon: BarChart3 },
        ],
      },
      {
        title: 'Content',
        items: [
          { path: '/editor/content', label: 'Content', icon: FileText },
          { path: '/editor/categories', label: 'Categories', icon: FolderOpen },
          { path: '/editor/tags', label: 'Tags', icon: Tags },
        ],
      },
      {
        title: 'Products',
        items: [{ path: '/editor/products', label: 'Products', icon: Package }],
      },
      {
        title: 'Reviews',
        items: [{ path: '/editor/review-management', label: 'Review Management', icon: PenSquare }],
      },
      {
        title: 'News',
        items: [{ path: '/editor/news-editor', label: 'News Editor', icon: FileText }],
      },
      {
        title: 'Settings',
        items: [
          { path: '/editor/settings', label: 'Settings', icon: Settings },
          { path: '/editor/site-settings', label: 'Site Settings', icon: Shield },
        ],
      },
    ],
    []
  );

  const currentPath = location.pathname.replace(/\/$/, '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
        <div className="hidden md:flex w-72 flex-col border-r border-white/10 p-6 space-y-4">
          <Skeleton className="h-12 w-full bg-white/10" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/10" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold">Could not load your profile.</p>
          <p className="text-sm text-white/70">{error.message}</p>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isEditor) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="space-y-3 text-center bg-white/5 border border-white/10 rounded-xl p-6 w-full max-w-md">
          <p className="text-lg font-semibold">Editor access required</p>
          <p className="text-sm text-white/70">Your role ({role}) does not have permission to open the editor workspace.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="secondary">
              <Link to="/">Return to site</Link>
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
      <Helmet>
        <title>Editor | Tech Beetle</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Overlay for mobile nav */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${
          isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsNavOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`w-72 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-200 ${
          isNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-lg border-2 border-white/20">
              <span style={{letterSpacing: '0.08em'}}>TB</span>
            </div>
            <div className="flex flex-col justify-center items-start ml-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold tracking-wide bg-white/10 px-2 py-0.5 rounded text-blue-200 shadow">TechBeetle</span>
                <span className="w-1 h-4 bg-gradient-to-b from-primary to-blue-700 rounded-full mx-1" />
                <span className="text-xs uppercase tracking-widest text-primary-300 font-semibold">{role}</span>
              </div>
              <span className="text-[10px] text-white/50 mt-1 ml-0.5 tracking-wider">Content Suite</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60 px-3">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-primary-foreground hover:bg-primary/80"
            size="sm"
            onClick={() => {
              setIsNavOpen(false);
              signOut();
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col ml-0 md:ml-72">
        <header className="items-center px-2 py-2 border-b border-white/10 sticky top-0 bg-slate-950/70 backdrop-blur z-20">
          <div className="items-center ">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Overview</p>
                <p className="text-lg font-semibold text-white mt-1">Create, review, publish</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Scope</p>
                <p className="text-lg font-semibold text-white mt-1">News, content, products</p>
              </div>
              <div className="bg-primary text-primary-foreground rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Fast actions</p>
                <div className="flex gap-2 mt-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/editor/content">New Content</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/editor/news-editor">New News</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">


          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
