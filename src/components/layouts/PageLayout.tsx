
import React, { ReactNode } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
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
        "flex-1 pt-24 pb-12 px-6 md:px-8 transition-all duration-300",
        fullWidth ? "" : "max-w-7xl mx-auto w-full",
        className
      )}>
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
