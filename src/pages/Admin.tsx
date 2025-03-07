
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import AdminFacesList from '@/components/admin/AdminFacesList';
import AttendanceCalendar from '@/components/admin/AttendanceCalendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [facesUpdated, setFacesUpdated] = useState<number>(0);
  const { isAdmin, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Auth protection
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, isLoading, navigate]);
  
  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to changes in attendance_records
    const subscription = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' }, 
        () => {
          // Increment the counter to trigger re-renders
          setFacesUpdated(prev => prev + 1);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // If still loading or not admin, show nothing yet
  if (isLoading || !isAdmin) {
    return null;
  }
  
  const handleLogout = async () => {
    await logout();
  };

  return (
    <PageLayout>
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage registered faces and view detailed attendance records"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="faces" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="faces" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Registered Faces</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Attendance Calendar</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="faces" className="space-y-4">
          <AdminFacesList 
            viewMode={viewMode} 
            selectedFaceId={selectedFaceId} 
            setSelectedFaceId={setSelectedFaceId}
            updateTrigger={facesUpdated} // Pass trigger for real-time updates
          />
        </TabsContent>
        <TabsContent value="calendar">
          <AttendanceCalendar 
            selectedFaceId={selectedFaceId}
            updateTrigger={facesUpdated} // Pass trigger for real-time updates
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Admin;
