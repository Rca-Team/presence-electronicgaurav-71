
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-8 py-4 backdrop-blur-md",
        isScrolled ? "bg-white/80 dark:bg-black/30 shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="animate-fade-in">
          <Logo />
        </Link>
        
        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex items-center space-x-1 animate-fade-in">
          {[
            { text: 'Home', path: '/' },
            { text: 'Dashboard', path: '/dashboard' },
            { text: 'Register', path: '/register' },
            { text: 'Attendance', path: '/attendance' },
            { text: 'Admin', path: '/admin' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.text}
            </Link>
          ))}
        </nav>
        
        {/* Sign In / Get Started buttons - Only show on desktop */}
        <div className="hidden md:flex items-center space-x-4 animate-fade-in">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="animate-pulse-subtle">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
