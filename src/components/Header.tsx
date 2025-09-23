
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f4698844-1da9-43a9-a069-1e48e120e170.png" 
              alt="TechBeetle" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/news" className="text-foreground/80 hover:text-primary transition-colors">
              News
            </Link>
            <Link to="/reviews" className="text-foreground/80 hover:text-primary transition-colors">
              Reviews
            </Link>
            <Link to="/videos" className="text-foreground/80 hover:text-primary transition-colors">
              Videos
            </Link>
            <Link to="/how-to" className="text-foreground/80 hover:text-primary transition-colors">
              How-To
            </Link>
            <Link to="/compare" className="text-foreground/80 hover:text-primary transition-colors">
              Compare
            </Link>
            <Link to="/products" className="text-foreground/80 hover:text-primary transition-colors">
              Products
            </Link>
          </nav>

          {/* Search and Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-64"
              />
            </div>
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
