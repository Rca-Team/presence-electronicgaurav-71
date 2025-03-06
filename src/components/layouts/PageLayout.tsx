
import React, { ReactNode } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileSidebar from '../MobileSidebar';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  noFooter?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className,
  fullWidth = false,
  noFooter = false
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn(
        "flex-1 pt-16 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 lg:px-8 transition-all duration-300",
        fullWidth ? "" : "max-w-7xl mx-auto w-full",
        className
      )}>
        {children}
      </main>
      {!noFooter && <Footer />}
      <MobileSidebar />
    </div>
  );
};

export default PageLayout;
