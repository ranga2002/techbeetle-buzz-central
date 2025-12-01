
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { label: 'Reviews', to: '/reviews' },
  { label: 'Videos', to: '/videos' },
  { label: 'How-To', to: '/how-to' },
  { label: 'Compare', to: '/compare' },
  { label: 'Products', to: '/products' },
];

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };
  
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f4698844-1da9-43a9-a069-1e48e120e170.png" 
              alt="TechBeetle" 
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-foreground/80 hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </form>
            <ThemeToggle />
            {user && <NotificationBell />}
            {user ? <UserMenu /> : <Button onClick={() => navigate('/auth')} size="sm">Sign In</Button>}
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-4 space-y-4">
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="text-lg">TechBeetle</DrawerTitle>
                </DrawerHeader>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </form>
                <div className="grid gap-3">
                  {navLinks.map((item) => (
                    <Button
                      key={item.to}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate(item.to);
                        setMobileOpen(false);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  {user ? (
                    <>
                      <NotificationBell />
                      <UserMenu />
                    </>
                  ) : (
                    <Button onClick={() => { navigate('/auth'); setMobileOpen(false); }} className="w-full">
                      Sign In
                    </Button>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
