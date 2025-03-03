
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-balance">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
