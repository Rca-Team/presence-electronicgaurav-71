
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Calendar as CalendarIcon, User } from 'lucide-react';

interface AttendanceCalendarProps {
  selectedFaceId: string | null;
}

interface AttendanceDay {
  date: Date;
  status: 'present' | 'absent';
  timestamp: string;
}

interface SelectedFace {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  image_url: string;
  position?: string;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedFaceId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [selectedFace, setSelectedFace] = useState<SelectedFace | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [monthAttendance, setMonthAttendance] = useState<{
    present: number;
    absent: number;
    total: number;
  }>({
    present: 0,
    absent: 0,
    total: 0
  });

  useEffect(() => {
    if (selectedFaceId) {
      fetchSelectedFace(selectedFaceId);
      fetchAttendanceRecords(selectedFaceId);
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
    }
  }, [selectedFaceId]);

  useEffect(() => {
    if (date && selectedFaceId) {
      calculateMonthStats(date);
    }
  }, [date, attendanceDays]);

  const fetchSelectedFace = async (faceId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', faceId)
        .single();

      if (error) throw error;

      if (data) {
        const deviceInfo = data.device_info as any;
        const metadata = deviceInfo?.metadata || {};
        
        setSelectedFace({
          id: data.id,
          name: metadata.name || 'Unknown',
          employee_id: metadata.employee_id || 'N/A',
          department: metadata.department || 'N/A',
          position: metadata.position || 'Student',
          image_url: metadata.firebase_image_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching selected face:', error);
    }
  };

  const fetchAttendanceRecords = async (faceId: string) => {
    try {
      setIsLoading(true);
      
      // First, get the employee_id from the selected face
      const { data: faceData, error: faceError } = await supabase
        .from('attendance_records')
        .select('device_info')
        .eq('id', faceId)
        .single();
        
      if (faceError) throw faceError;
      
      const deviceInfo = faceData.device_info as any;
      const employeeId = deviceInfo?.metadata?.employee_id;
      
      if (!employeeId) {
        toast({
          title: "Error",
          description: "Could not identify employee ID for attendance records",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Now fetch all attendance records for this employee_id
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .contains('device_info', { employee_id: employeeId })
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      
      // Process the attendance data
      const attendanceMap = new Map<string, AttendanceDay>();
      
      if (data) {
        data.forEach(record => {
          if (record.timestamp) {
            const date = new Date(record.timestamp);
            const dateString = format(date, 'yyyy-MM-dd');
            
            // Only add if this date hasn't been recorded yet (take the earliest record for each day)
            if (!attendanceMap.has(dateString)) {
              attendanceMap.set(dateString, {
                date,
                status: record.status === 'present' ? 'present' : 'absent',
                timestamp: record.timestamp
              });
            }
          }
        });
        
        // Convert map to array
        const attendanceArray = Array.from(attendanceMap.values());
        setAttendanceDays(attendanceArray);
        
        // Calculate stats for the current month
        if (date) {
          calculateMonthStats(date);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthStats = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Filter for records in the selected month
    const monthRecords = attendanceDays.filter(day => {
      const recordDate = new Date(day.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });
    
    const present = monthRecords.filter(day => day.status === 'present').length;
    const total = monthRecords.length;
    
    setMonthAttendance({
      present,
      absent: total - present,
      total
    });
  };

  // Function to render the date content with attendance status
  const renderDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const attendance = attendanceDays.find(
      a => format(new Date(a.date), 'yyyy-MM-dd') === dateStr
    );
    
    if (!attendance) return null;
    
    return (
      <div className="flex items-center justify-center w-full h-full">
        {attendance.status === 'present' ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedFaceId ? (
        <>
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : selectedFace ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>
                    {format(date || new Date(), 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedFace.image_url ? (
                        <img 
                          src={selectedFace.image_url} 
                          alt={selectedFace.name} 
                          className="h-16 w-16 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedFace.name}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">{selectedFace.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedFace.department}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">Present</p>
                          <p className="text-2xl font-semibold text-green-600">{monthAttendance.present}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">Absent</p>
                          <p className="text-2xl font-semibold text-red-600">{monthAttendance.absent}</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-semibold">
                          {monthAttendance.total > 0 
                            ? `${Math.round((monthAttendance.present / monthAttendance.total) * 100)}%` 
                            : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Present</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Absent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Attendance Calendar</CardTitle>
                      <CardDescription>
                        View attendance records for {selectedFace.name}
                      </CardDescription>
                    </div>
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    components={{
                      DayContent: ({ day }) => (
                        <>
                          <div>{format(day, 'd')}</div>
                          {renderDay(day)}
                        </>
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <User className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">Face data not found</h3>
                <p className="text-muted-foreground">The selected face record could not be found</p>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <User className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">No face selected</h3>
            <p className="text-muted-foreground">Select a face from the list to view attendance records</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendanceCalendar;
