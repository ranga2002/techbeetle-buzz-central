
import React from 'react';
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
  Package
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminLayout = () => {
  const { signOut } = useAuth();
  const { user, profile, isLoading, hasContentAccess, error } = useAdminAuth();
  const location = useLocation();

  console.log('AdminLayout - Auth state:', { 
    user: !!user, 
    profile, 
    isLoading, 
    hasContentAccess,
    error: error?.message,
    currentPath: location.pathname
  });

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
    console.log('AdminLayout - No user, redirecting to auth');
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
    console.log('AdminLayout - Access denied, user role:', profile.role);
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

  const isAdmin = profile.role === 'admin';
  const isEditor = ['admin', 'editor'].includes(profile.role);

  const navigationItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'editor', 'author'] },
    { path: '/admin/content', icon: FileText, label: 'Content', roles: ['admin', 'editor', 'author'] },
    { path: '/admin/users', icon: Users, label: 'Users', roles: ['admin', 'editor'] },
    { path: '/admin/comments', icon: MessageSquare, label: 'Comments', roles: ['admin', 'editor'] },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories', roles: ['admin', 'editor'] },
    { path: '/admin/tags', icon: Tags, label: 'Tags', roles: ['admin', 'editor'] },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
    { path: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
    { path: '/admin/news-test', icon: Rss, label: 'News API Test', roles: ['admin'] },
    { path: '/admin/product-scraper', icon: Package, label: 'Product Management', roles: ['admin', 'editor'] },
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r flex flex-col">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <span className="font-semibold text-lg">TechBeetle Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={() => {
              console.log('Sign out clicked');
              signOut();
            }}
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigationItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
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

export default AdminLayout;
