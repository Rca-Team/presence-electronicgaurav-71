
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, UserPlus, ClipboardCheck, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Only render for mobile
  if (!isMobile) {
    return null;
  }
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { icon: Home, text: 'Home', path: '/' },
    { icon: LayoutDashboard, text: 'Dashboard', path: '/dashboard' },
    { icon: UserPlus, text: 'Register', path: '/register' },
    { icon: ClipboardCheck, text: 'Attendance', path: '/attendance' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="rounded-full h-12 w-12 shadow-lg" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[75vw] max-w-xs">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex justify-center">
              <Logo />
            </SheetTitle>
          </SheetHeader>
          
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.text}</span>
              </Link>
            ))}
          </nav>
          
          <div className="flex flex-col gap-2 mt-auto pt-6">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSidebar;
