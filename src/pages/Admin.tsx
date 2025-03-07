
import React, { useState } from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import AdminFacesList from '@/components/admin/AdminFacesList';
import AttendanceCalendar from '@/components/admin/AttendanceCalendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar } from 'lucide-react';

const Admin = () => {
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <PageLayout>
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage registered faces and view detailed attendance records"
      >
        <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </Button>
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
          />
        </TabsContent>
        <TabsContent value="calendar">
          <AttendanceCalendar selectedFaceId={selectedFaceId} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Admin;
