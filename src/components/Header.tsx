
import { useState } from 'react';
import { Search, Menu, X, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'News', href: '#' },
    { label: 'Reviews', href: '#' },
    { label: 'Videos', href: '#' },
    { label: 'How-To', href: '#' },
    { label: 'Compare', href: '#' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
            <span className="text-2xl font-bold text-gradient">TechBeetle</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" className="hidden md:flex">
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="py-4 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {item.label}
                </a>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-4">
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
