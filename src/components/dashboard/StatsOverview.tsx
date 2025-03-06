
import React from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsOverviewProps {
  isLoading: boolean;
  data?: {
    totalEmployees?: number;
    presentToday?: number;
    presentPercentage?: number;
    weeklyAverage?: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ isLoading, data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-up">
      {isLoading ? (
        <>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </>
      ) : (
        <>
          <StatCard
            title="Total Employees"
            value={data?.totalEmployees || "..."}
            trend={{ value: 12, positive: true }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            }
          />
          
          <StatCard
            title="Present Today"
            value={data?.presentToday || "..."}
            description={`${data?.presentPercentage || 0}% attendance rate`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            }
          />
          
          <StatCard
            title="Average Weekly"
            value={`${data?.weeklyAverage || 0}%`}
            trend={{ value: 5, positive: true }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            }
          />
        </>
      )}
    </div>
  );
};

export default StatsOverview;
