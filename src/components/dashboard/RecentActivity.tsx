
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface RecentActivityProps {
  isLoading: boolean;
  activityData?: any[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ isLoading, activityData: initialActivityData }) => {
  const [activityData, setActivityData] = useState(initialActivityData || []);

  useEffect(() => {
    // Set initial data from props
    if (initialActivityData) {
      setActivityData(initialActivityData);
    }

    // Setup real-time data fetch with 1-second interval
    const fetchRecentActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*, user_id')
          .order('timestamp', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching recent activity:', error);
          return;
        }
        
        if (data) {
          setActivityData(data);
        }
      } catch (err) {
        console.error('Failed to fetch recent activity:', err);
      }
    };

    // Fetch immediately and then set up interval
    fetchRecentActivity();
    const intervalId = setInterval(fetchRecentActivity, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [initialActivityData]);

  return (
    <Card className="p-6 md:col-span-2 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : (
          activityData?.map((item: any, index: number) => {
            const deviceInfo = item.device_info && typeof item.device_info === 'object' ? item.device_info : null;
            const metadata = deviceInfo?.metadata || {};
            const name = metadata.name || `User ${item.user_id?.substring(0, 4) || 'Unknown'}`;
            const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const status = item.status === 'present' ? 'Checked in' : 
                          item.status === 'late' ? 'Checked in (Late)' : 'Unauthorized';
            
            return (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">{name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{time}</p>
                  </div>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  status.includes('Late') 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' 
                    : status.includes('Unauthorized')
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                }`}>
                  {status}
                </span>
              </div>
            );
          }) || []
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
