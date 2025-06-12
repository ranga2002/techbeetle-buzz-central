
import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  LogOut
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
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

  if (!user || !profile || !['admin', 'editor', 'author'].includes(profile.role)) {
    return <Navigate to="/" replace />;
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
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <span className="font-semibold text-lg">TechBeetle Admin</span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-2">
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

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full justify-start"
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
