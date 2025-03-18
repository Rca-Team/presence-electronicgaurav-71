
import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import PageLayout from '@/components/layouts/PageLayout';
import { loadModels } from '@/services/face-recognition/ModelService';
import AttendanceCapture from '@/components/attendance/AttendanceCapture';
import AttendanceInstructions from '@/components/attendance/AttendanceInstructions';
import AttendanceSidebar from '@/components/attendance/AttendanceSidebar';

const Attendance = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    const initModels = async () => {
      try {
        await loadModels();
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        toast({
          title: "Model Loading Error",
          description: "Failed to load face recognition models. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    initModels();
  }, [toast]);
  
  return (
    <PageLayout>
      <PageHeader
        title="Take Attendance"
        description="Record attendance using facial recognition"
        className="animate-slide-in-down"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-slide-in-up">
          <AttendanceCapture />
          <AttendanceInstructions />
        </div>
        <AttendanceSidebar />
      </div>
    </PageLayout>
  );
};

export default Attendance;
