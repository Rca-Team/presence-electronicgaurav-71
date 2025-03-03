
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Webcam } from '@/components/ui/webcam';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import PageLayout from '@/components/layouts/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import useFaceRecognition from '@/hooks/useFaceRecognition';
import { loadModels } from '@/services/FaceRecognitionService';

const Attendance = () => {
  const { toast } = useToast();
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  });
  
  const {
    processFace,
    isProcessing,
    isModelLoading,
    result,
    error,
    resetResult
  } = useFaceRecognition();
  
  // Load face-api models
  useEffect(() => {
    const initModels = async () => {
      try {
        // Create a /public/models directory and add the face-api.js models there
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
  
  // Fetch recent attendance data
  useEffect(() => {
    const fetchRecentAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          timestamp,
          confidence_score,
          profiles(username)
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching recent attendance:', error);
        return;
      }
      
      if (data) {
        setRecentAttendance(data.map(record => ({
          name: record.profiles?.username || 'Unknown',
          time: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
          confidence: record.confidence_score
        })));
      }
    };
    
    fetchRecentAttendance();
    
    // Set up real-time subscription for new attendance records
    const subscription = supabase
      .channel('attendance_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'attendance_records' 
      }, () => {
        fetchRecentAttendance();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch attendance statistics
  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get total profiles (users)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }
      
      const totalProfiles = profilesData?.length || 0;
      
      // Get present users today
      const { data: presentData, error: presentError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'present')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (presentError) {
        console.error('Error fetching present users:', presentError);
        return;
      }
      
      const presentUsers = presentData?.length || 0;
      
      // Get late users today
      const { data: lateData, error: lateError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'late')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (lateError) {
        console.error('Error fetching late users:', lateError);
        return;
      }
      
      const lateUsers = lateData?.length || 0;
      
      // Calculate absent users
      const absentUsers = Math.max(0, totalProfiles - presentUsers - lateUsers);
      
      setStats({
        present: presentUsers,
        late: lateUsers,
        absent: absentUsers,
        total: totalProfiles
      });
    };
    
    fetchStats();
  }, []);
  
  // Handle face recognition capture
  const handleCapture = async (imageData: string) => {
    if (!webcamRef.current || isProcessing || isModelLoading) return;
    
    try {
      const recognitionResult = await processFace(webcamRef.current);
      
      if (!recognitionResult) {
        toast({
          title: "Processing Error",
          description: error || "Failed to process face. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (!recognitionResult.recognized) {
        toast({
          title: "Recognition Failed",
          description: "This person is not registered in the system.",
          variant: "destructive",
        });
        return;
      }
      
      // Person recognized
      toast({
        title: "Attendance Recorded",
        description: `${recognitionResult.employee.name} marked as ${recognitionResult.status} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        variant: recognitionResult.status === 'late' ? "destructive" : "default",
      });
      
    } catch (err) {
      console.error('Face recognition error:', err);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the image.",
        variant: "destructive",
      });
    }
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
                showControls={!isProcessing && !result}
                autoStart={!result}
              />
              
              {isModelLoading && (
                <div className="flex flex-col items-center py-4">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
                  <p className="text-muted-foreground">Loading face recognition models...</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="flex flex-col items-center py-4">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
                  <p className="text-muted-foreground">Processing face recognition...</p>
                </div>
              )}
              
              {result && (
                <div className={`rounded-lg p-6 text-center ${
                  result.status === 'unauthorized' 
                    ? 'bg-destructive/10 border border-destructive/20' 
                    : 'bg-secondary/50'
                }`}>
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    result.status === 'unauthorized'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {result.status === 'unauthorized' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-xl">
                        <path d="M17.5 6.5c0 3-2.5 4-2.5 8"></path>
                        <path d="M12 18h.01"></path>
                        <circle cx="12" cy="12" r="9"></circle>
                      </svg>
                    ) : (
                      <span className="text-xl font-semibold">{result.employee?.name.charAt(0)}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold">
                    {result.status === 'unauthorized' ? 'Unknown Person' : result.employee?.name}
                  </h3>
                  
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-opacity-10 text-sm font-medium">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      result.status === 'present' 
                        ? 'bg-green-500' 
                        : result.status === 'late'
                        ? 'bg-yellow-500'
                        : 'bg-destructive'
                    }`}></span>
                    {result.status === 'unauthorized' 
                      ? 'Not Registered' 
                      : `Marked as ${result.status}`}
                  </div>
                  
                  {result.timestamp && (
                    <p className="text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  
                  {result.status === 'unauthorized' && (
                    <p className="mt-3 text-sm text-destructive">
                      This person is not registered in the system.
                    </p>
                  )}
                  
                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={resetResult}>
                      Take Another
                    </Button>
                    
                    {result.status === 'unauthorized' && (
                      <Button
                        variant="outline"
                        onClick={() => {
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
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No attendance records for today
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4 pt-4">
              <StatCard
                title="Present Today"
                value={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'}
                description={`${stats.present} out of ${stats.total} profiles`}
                className="mb-4"
              />
              
              <StatCard
                title="Late Arrivals"
                value={String(stats.late)}
                description={stats.total > 0 ? `${Math.round((stats.late / stats.total) * 100)}% of total profiles` : '0% of total profiles'}
                className="mb-4"
              />
              
              <StatCard
                title="Absent"
                value={String(stats.absent)}
                description={stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}% of total profiles` : '0% of total profiles'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default Attendance;
