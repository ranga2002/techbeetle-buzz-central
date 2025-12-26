
import React, { useMemo, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  BarChart3,
  MessageSquare,
  Tags,
  FolderOpen,
  LogOut,
  Rss,
  Package,
  Shield,
  Globe,
  Menu
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }
  componentDidCatch(error: Error) {
    console.error("Admin boundary caught error", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-destructive">
          <p className="font-semibold mb-1">Something went wrong in the admin panel.</p>
          <p className="text-sm text-destructive/80 mb-3">{this.state.message || "Please retry."}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminLayout = () => {
  const { signOut } = useAuth();
  const { user, profile, isLoading, hasContentAccess, error } = useAdminAuth();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const role = profile?.role || 'user';

  const navSections = useMemo(() => ([
    {
      title: 'Overview',
      items: [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'editor', 'author'] },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
        { path: '/admin/seo', icon: Globe, label: 'SEO & Analytics', roles: ['admin'] },
      ],
    },
    {
      title: 'Content',
      items: [
        { path: '/admin/content', icon: FileText, label: 'Content', roles: ['admin', 'editor', 'author'] },
        { path: '/admin/categories', icon: FolderOpen, label: 'Categories', roles: ['admin', 'editor'] },
        { path: '/admin/tags', icon: Tags, label: 'Tags', roles: ['admin', 'editor'] },
        { path: '/admin/comments', icon: MessageSquare, label: 'Comments', roles: ['admin', 'editor'] },
      ],
    },
    {
      title: 'People',
      items: [
        { path: '/admin/users', icon: Users, label: 'Users', roles: ['admin'] },
      ],
    },
    {
      title: 'Products',
      items: [
        { path: '/admin/product-scraper', icon: Package, label: 'Amazon Fetcher', roles: ['admin'] },
        { path: '/admin/inventory', icon: Package, label: 'Products', roles: ['admin', 'editor'] },
      ],
    },
    {
      title: 'Reviews',
      items: [
        { path: '/admin/product-management', icon: FileText, label: 'Review Management', roles: ['admin', 'editor'] },
        { path: '/admin/review-generator', icon: Package, label: 'Review Generator', roles: ['admin'] },
      ],
    },
    {
      title: 'Tools',
      items: [
        { path: '/admin/news-editor', icon: FileText, label: 'News Editor', roles: ['admin', 'editor'] },
        { path: '/admin/news-test', icon: Rss, label: 'News API Test', roles: ['admin'] },
      ],
    },
    {
      title: 'Settings',
      items: [
        { path: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
        { path: '/admin/site-settings', icon: Shield, label: 'Site Settings', roles: ['admin'] },
      ],
    },
  ]), []);

  const navigationItems = useMemo(
    () => navSections.flatMap((section) => section.items),
    [navSections]
  );

  const filteredNavSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.roles.includes(role)),
        }))
        .filter((section) => section.items.length > 0),
    [navSections, role]
  );

  const currentRoute = useMemo(
    () =>
      navigationItems.find(
        (item) =>
          location.pathname === item.path || location.pathname.startsWith(item.path + '/')
      ),
    [location.pathname, navigationItems]
  );

  const hasRouteAccess = currentRoute ? currentRoute.roles.includes(role) : hasContentAccess;

  const breadcrumbs = useMemo(() => {
    const path = location.pathname.replace('/admin', '').split('/').filter(Boolean);
    const base = [{ label: 'Dashboard', path: '/admin' }];
    let acc = '/admin';
    const trail = path.map((segment) => {
      acc += `/${segment}`;
      return { label: segment.replace(/-/g, ' '), path: acc };
    });
    return [...base, ...trail];
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-64 bg-white shadow-sm border-r">
          <Skeleton className="h-16 m-4" />
          <div className="space-y-2 p-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error message if there's an issue fetching profile
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert className="mb-4">
            <AlertDescription>
              Error loading user profile: {error.message}
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if profile doesn't exist (user needs to complete profile setup)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Alert className="mb-4">
            <AlertDescription>
              Your profile is not set up yet. Please contact an administrator to assign you a role.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm text-gray-600">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
          </div>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Check if user doesn't have content access
  if (!hasContentAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Alert className="mb-4">
            <AlertDescription>
              You don't have permission to access the admin panel. Your current role is: {profile.role || 'none'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Enforce per-route access based on role
  if (!hasRouteAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 p-6 bg-white rounded-lg shadow-sm border">
          <Alert>
            <AlertDescription>
              You don't have permission to view this admin page. Your role: {profile.role || 'none'}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link to="/admin">Go to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link to="/">Return to site</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Helmet>
        <title>Admin | Tech Beetle</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${
          isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsNavOpen(false)}
      />
      {/* Sidebar */}
      <aside className={`w-72 bg-card shadow-sm border-r border-border flex flex-col transition-transform duration-200 md:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed inset-y-0 left-0 z-40`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
          </Link>
          <Badge variant="outline" className="capitalize">{profile.role}</Badge>
        </div>
        
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {filteredNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsNavOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Link to="/" className="flex items-center" onClick={() => setIsNavOpen(false)}>
              <Globe className="w-4 h-4 mr-2" />
              View site
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setIsNavOpen(false); signOut(); }}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-72">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setIsNavOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground capitalize">{profile.role}</span>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <nav className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-4">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={crumb.path} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-muted-foreground/60">/</span>}
                  {isLast ? (
                    <span className="text-foreground font-medium capitalize">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="hover:text-foreground capitalize">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
