
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

// Import refactored components
import StatsOverview from '@/components/dashboard/StatsOverview';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import RecentActivity from '@/components/dashboard/RecentActivity';
import StatusChart from '@/components/dashboard/StatusChart';
import RegisteredFaces from '@/components/dashboard/RegisteredFaces';

// Import services
import { 
  fetchAttendanceStats, 
  fetchRegisteredFaces 
} from '@/services/dashboard/dashboardService';

const Dashboard = () => {
  // Fetch attendance data using react-query
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchAttendanceStats,
    refetchInterval: 1000, // Refetch every 1 second for real-time updates
  });
  
  // Fetch registered faces
  const { 
    data: registeredFaces, 
    isLoading: facesLoading, 
    error: facesError,
    refetch: refetchFaces
  } = useQuery({
    queryKey: ['registeredFaces'],
    queryFn: fetchRegisteredFaces,
    refetchInterval: 1000, // Updated to 1 second for real-time updates
  });
  
  // Check for error state
  if (error) {
    console.error('Error fetching dashboard data:', error);
  }
  
  if (facesError) {
    console.error('Error fetching registered faces:', facesError);
  }
  
  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your attendance statistics and analytics"
        className="animate-slide-in-down"
      >
        <Link to="/attendance">
          <Button>Take Attendance</Button>
        </Link>
      </PageHeader>
      
      {/* Stats Overview */}
      <StatsOverview isLoading={isLoading} data={data} />
      
      {/* Charts */}
      <DashboardCharts 
        isLoading={isLoading} 
        weeklyData={data?.weeklyData} 
        departmentData={data?.departmentData} 
      />
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <RecentActivity 
          isLoading={isLoading} 
          activityData={data?.recentActivity} 
        />
        
        <StatusChart 
          isLoading={isLoading} 
          statusData={data?.statusData} 
        />
      </div>
      
      {/* Registered Faces Section */}
      <RegisteredFaces 
        isLoading={facesLoading} 
        faces={registeredFaces} 
        refetchFaces={refetchFaces} 
      />
    </PageLayout>
  );
};

export default Dashboard;
