
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, Shield, Bookmark, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  const { hasContentAccess, isLoading: adminLoading } = useAdminAuth();

  if (loading || adminLoading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild>
          <Link to="/auth">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  console.log('UserMenu - hasContentAccess:', hasContentAccess);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/bookmarks" className="flex items-center">
            <Bookmark className="mr-2 h-4 w-4" />
            My Bookmarks
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/reading-history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            Reading History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/preferences" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {hasContentAccess && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            console.log('User menu sign out clicked');
            signOut();
          }} 
          className="flex items-center cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
