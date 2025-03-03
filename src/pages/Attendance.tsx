
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Webcam } from '@/components/ui/webcam';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import PageLayout from '@/components/layouts/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

// Sample data
const recentAttendanceData = [
  { name: 'John Doe', time: '08:32 AM', status: 'Present' },
  { name: 'Jane Smith', time: '08:45 AM', status: 'Present' },
  { name: 'Michael Brown', time: '09:01 AM', status: 'Late' },
  { name: 'Emily Johnson', time: '08:15 AM', status: 'Present' },
  { name: 'Robert Davis', time: '08:28 AM', status: 'Present' },
  { name: 'Sarah Garcia', time: '09:15 AM', status: 'Late' },
  { name: 'William Martinez', time: '08:55 AM', status: 'Present' },
];

const Attendance = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<{
    name: string;
    status: 'Present' | 'Absent' | 'Late' | 'Unknown';
    time: string;
  } | null>(null);
  
  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate face recognition with database check
      // In a real app, this would call an API endpoint that processes the image
      // For simulation, we'll add unknown face detection with a 30% chance
      const recognitionResult = await simulateFaceRecognition(imageData);
      
      if (recognitionResult.found) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const time = `${formattedHours}:${formattedMinutes} ${ampm}`;
        
        const status = hours < 9 ? 'Present' : 'Late';
        
        setAttendanceResult({
          name: recognitionResult.name,
          status: status as 'Present' | 'Late',
          time,
        });
        
        toast({
          title: "Attendance Recorded",
          description: `${recognitionResult.name} marked as ${status} at ${time}`,
          variant: status === 'Late' ? "destructive" : "default",
        });
      } else {
        // Person not found in database
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const time = `${formattedHours}:${formattedMinutes} ${ampm}`;
        
        setAttendanceResult({
          name: "Unknown Person",
          status: 'Unknown',
          time,
        });
        
        toast({
          title: "Recognition Failed",
          description: "This person is not registered in the system.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Simulate face recognition with database check
  const simulateFaceRecognition = async (imageData: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate a 30% chance of not finding the person in the database
    const notFound = Math.random() < 0.3;
    
    if (notFound) {
      return { found: false };
    }
    
    // Simulate successful recognition with random data
    const names = ['John Doe', 'Jane Smith', 'Michael Brown', 'Emily Johnson', 'Robert Davis'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    return {
      found: true,
      name: randomName,
    };
  };
  
  const resetAttendance = () => {
    setAttendanceResult(null);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Take Attendance"
        description="Record attendance using facial recognition"
        className="animate-slide-in-down"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-slide-in-up">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Facial Recognition</h3>
            <div className="space-y-4">
              <Webcam
                onCapture={handleCapture}
                className="w-full"
                showControls={!isProcessing && !attendanceResult}
                autoStart={!attendanceResult}
              />
              
              {isProcessing && (
                <div className="flex flex-col items-center py-4">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
                  <p className="text-muted-foreground">Processing face recognition...</p>
                </div>
              )}
              
              {attendanceResult && (
                <div className={`rounded-lg p-6 text-center ${
                  attendanceResult.status === 'Unknown' 
                    ? 'bg-destructive/10 border border-destructive/20' 
                    : 'bg-secondary/50'
                }`}>
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    attendanceResult.status === 'Unknown'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {attendanceResult.status === 'Unknown' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-xl">
                        <path d="M17.5 6.5c0 3-2.5 4-2.5 8"></path>
                        <path d="M12 18h.01"></path>
                        <circle cx="12" cy="12" r="9"></circle>
                      </svg>
                    ) : (
                      <span className="text-xl font-semibold">{attendanceResult.name.charAt(0)}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold">{attendanceResult.name}</h3>
                  
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-opacity-10 text-sm font-medium">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      attendanceResult.status === 'Present' 
                        ? 'bg-green-500' 
                        : attendanceResult.status === 'Late'
                        ? 'bg-yellow-500'
                        : 'bg-destructive'
                    }`}></span>
                    {attendanceResult.status === 'Unknown' 
                      ? 'Not Registered' 
                      : `Marked as ${attendanceResult.status}`}
                  </div>
                  
                  <p className="text-muted-foreground mt-1">
                    {attendanceResult.time}
                  </p>
                  
                  {attendanceResult.status === 'Unknown' && (
                    <p className="mt-3 text-sm text-destructive">
                      This person is not registered in the system.
                    </p>
                  )}
                  
                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      onClick={resetAttendance}
                    >
                      Take Another
                    </Button>
                    
                    {attendanceResult.status === 'Unknown' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Navigate to registration page
                          window.location.href = '/register';
                        }}
                      >
                        Register New Person
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Instructions</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Stand directly in front of the camera</h4>
                  <p className="text-sm text-muted-foreground">Position yourself about 1-2 feet away from the camera.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" x2="6" y1="1" y2="4"></line>
                    <line x1="10" x2="10" y1="1" y2="4"></line>
                    <line x1="14" x2="14" y1="1" y2="4"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Ensure good lighting</h4>
                  <p className="text-sm text-muted-foreground">Poor lighting can affect recognition accuracy.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.33 20 7 18.5 7 16C7 13.5 9.33 12 12 12C14.67 12 17 13.5 17 16C17 18.5 14.67 20 12 20Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">Look directly at the camera</h4>
                  <p className="text-sm text-muted-foreground">Your face should be clearly visible and not obstructed.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6 animate-slide-in-right">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="space-y-4 pt-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Recent Records</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {recentAttendanceData.map((record, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium text-xs">{record.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.name}</p>
                          <p className="text-xs text-muted-foreground">{record.time}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4 pt-4">
              <StatCard
                title="Present Today"
                value="85%"
                description="105 out of 124 employees"
                className="mb-4"
              />
              
              <StatCard
                title="Late Arrivals"
                value="12"
                description="9.7% of total employees"
                className="mb-4"
              />
              
              <StatCard
                title="Absent"
                value="7"
                description="5.6% of total employees"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default Attendance;
