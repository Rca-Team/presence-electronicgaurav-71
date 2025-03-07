
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Home, BarChart, UserPlus, Clock, Menu, User, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Close the sidebar when location changes
    setOpen(false);
  }, [location.pathname]);
  
  // Hide on desktop
  if (!isMobile) return null;
  
  const navigation = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart },
    { name: 'Register', path: '/register', icon: UserPlus },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Admin', path: '/admin', icon: ShieldCheck },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden flex justify-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] p-0 border-t">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <Logo />
            </div>
            
            <nav className="px-2 pt-4 pb-2 flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center py-3 px-4 rounded-lg",
                        isActive(item.path)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 mr-3",
                        isActive(item.path) ? "text-primary" : "text-muted-foreground"
                      )} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t space-y-2">
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="block">
                <Button className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSidebar;
