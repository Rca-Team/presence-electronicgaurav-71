
import React, { useState, useEffect } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Clock } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface AttendanceCalendarProps {
  selectedFaceId: string | null;
}

// Define an interface for student/face information
interface FaceInfo {
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedFaceId }) => {
  const { toast } = useToast();
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 2, 8)); // March 8, 2025
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<{
    id: string;
    timestamp: string;
    status: string;
  }[]>([]);

  const isDateInArray = (date: Date, dateArray: Date[]): boolean => {
    return dateArray.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  useEffect(() => {
    let attendanceChannel: any = null;

    if (selectedFaceId) {
      fetchSelectedFace(selectedFaceId);
      fetchAttendanceRecords(selectedFaceId);

      // Set up real-time subscription for any attendance changes
      attendanceChannel = supabase
        .channel(`attendance-calendar-${selectedFaceId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance_records'
          }, 
          (payload) => {
            console.log('Real-time update received for attendance calendar:', payload);
            // Refresh data whenever there's a change to attendance records
            fetchAttendanceRecords(selectedFaceId);
            if (selectedDate) {
              fetchDailyAttendance(selectedFaceId, selectedDate);
            }
          }
        )
        .subscribe();

      console.log('Subscribed to real-time updates for attendance calendar');
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
    }

    return () => {
      if (attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
        console.log('Unsubscribed from attendance calendar updates');
      }
    };
  }, [selectedFaceId]);

  useEffect(() => {
    if (selectedFaceId && selectedDate) {
      fetchDailyAttendance(selectedFaceId, selectedDate);
    } else {
      setDailyAttendance([]);
    }
  }, [selectedFaceId, selectedDate]);

  const fetchSelectedFace = async (faceId: string) => {
    try {
      // Instead of querying registered_faces which doesn't exist in the type definition,
      // check the attendance_records for metadata about the face/user
      const { data, error } = await supabase
        .from('attendance_records')
        .select('device_info, user_id')
        .eq('id', faceId)
        .single();
          
      if (error) {
        console.error('Error fetching face details from attendance_records:', error);
        
        // Try checking by user_id as fallback
        const { data: userData, error: userError } = await supabase
          .from('attendance_records')
          .select('device_info')
          .eq('user_id', faceId)
          .single();
          
        if (userError) {
          console.error('Error fetching face details by user_id:', userError);
          
          // Set default face info if nothing is found
          setSelectedFace({
            name: 'Unknown Student',
            employee_id: faceId,
            department: 'N/A',
            position: 'Student'
          });
          return;
        }
        
        if (userData) {
          const deviceInfo = userData.device_info as any;
          if (deviceInfo && typeof deviceInfo === 'object' && !Array.isArray(deviceInfo)) {
            const metadata = deviceInfo.metadata && typeof deviceInfo.metadata === 'object' && !Array.isArray(deviceInfo.metadata) 
              ? deviceInfo.metadata 
              : {};
            
            setSelectedFace({
              name: metadata.name || 'Unknown Student',
              employee_id: metadata.employee_id || faceId,
              department: metadata.department || 'N/A',
              position: metadata.position || 'Student',
            });
          } else {
            setSelectedFace({
              name: 'Unknown Student',
              employee_id: faceId,
              department: 'N/A',
              position: 'Student'
            });
          }
          return;
        }
      }

      if (data) {
        const deviceInfo = data.device_info as any;
        if (deviceInfo && typeof deviceInfo === 'object' && !Array.isArray(deviceInfo)) {
          const metadata = deviceInfo.metadata && typeof deviceInfo.metadata === 'object' && !Array.isArray(deviceInfo.metadata) 
            ? deviceInfo.metadata 
            : {};
          
          setSelectedFace({
            name: metadata.name || 'Unknown Student',
            employee_id: metadata.employee_id || data.user_id || faceId,
            department: metadata.department || 'N/A',
            position: metadata.position || 'Student',
          });
        } else {
          setSelectedFace({
            name: 'Unknown Student',
            employee_id: data.user_id || faceId,
            department: 'N/A',
            position: 'Student'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching face details:', error);
      toast({
        title: "Error",
        description: "Failed to load face details",
        variant: "destructive"
      });
      
      // Set default values in case of error
      setSelectedFace({
        name: 'Unknown Student',
        employee_id: faceId,
        department: 'N/A',
        position: 'Student'
      });
    }
  };

  const fetchAttendanceRecords = async (faceId: string) => {
    try {
      setLoading(true);
      console.log('Fetching attendance records for face ID:', faceId);
      
      // Try to get attendance records using the face ID in different places
      const query = supabase.from('attendance_records');
      
      // Record might have faceId as its own id or as user_id or in device_info metadata
      const { data: recordsPresent, error: errorPresent } = await query
        .select('*')
        .eq('status', 'present')
        .or(`id.eq.${faceId},user_id.eq.${faceId}`);
      
      if (errorPresent) {
        console.error('Error fetching present records:', errorPresent);
        toast({
          title: "Error",
          description: "Failed to load attendance records",
          variant: "destructive"
        });
      } else {
        console.log('Present records found:', recordsPresent?.length || 0);
      }
      
      const { data: recordsLate, error: errorLate } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('status', 'late')
        .or(`id.eq.${faceId},user_id.eq.${faceId}`);
      
      if (errorLate) {
        console.error('Error fetching late records:', errorLate);
      } else {
        console.log('Late records found:', recordsLate?.length || 0);
      }
      
      if (recordsPresent) {
        const days = recordsPresent
          .map(record => record.timestamp ? new Date(record.timestamp) : null)
          .filter(date => date !== null) as Date[];
        
        console.log('Setting present days:', days.length);
        setAttendanceDays(days);
      }
      
      if (recordsLate) {
        const lateDays = recordsLate
          .map(record => record.timestamp ? new Date(record.timestamp) : null)
          .filter(date => date !== null) as Date[];
        
        console.log('Setting late days:', lateDays.length);
        setLateAttendanceDays(lateDays);
      }
    } catch (error) {
      console.error('Error in fetchAttendanceRecords:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyAttendance = async (faceId: string, date: Date) => {
    try {
      console.log('Fetching daily attendance for date:', date);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query by both id and user_id to catch all possible records
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('id, timestamp, status')
        .or(`id.eq.${faceId},user_id.eq.${faceId}`)
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('Error fetching daily attendance:', error);
        throw error;
      }
      
      if (records) {
        console.log('Daily attendance records found:', records.length);
        setDailyAttendance(records);
      }
    } catch (error) {
      console.error('Error in fetchDailyAttendance:', error);
      toast({
        title: "Error",
        description: "Failed to load daily attendance details",
        variant: "destructive"
      });
    }
  };

  // Custom day class name function to apply styling to calendar days
  const getDayClassName = (date: Date) => {
    // Check if the date is today (March 8, 2025)
    if (date.getDate() === 8 && date.getMonth() === 2 && date.getFullYear() === 2025) {
      return "bg-accent text-accent-foreground hover:bg-accent/80";
    }
    
    if (isDateInArray(date, lateAttendanceDays)) {
      return "bg-amber-500 text-white hover:bg-amber-600";
    }
    if (isDateInArray(date, attendanceDays)) {
      return "bg-green-500 text-white hover:bg-green-600";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {selectedFaceId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex space-x-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Present</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm">Late</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-accent mr-2"></div>
                      <span className="text-sm">Today (March 8)</span>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiersStyles={{
                      present: { 
                        backgroundColor: "rgb(34, 197, 94)", 
                        color: "white"
                      },
                      late: { 
                        backgroundColor: "rgb(245, 158, 11)", 
                        color: "white"
                      },
                      today: {
                        backgroundColor: "hsl(var(--accent))",
                        color: "hsl(var(--accent-foreground))"
                      }
                    }}
                    modifiers={{
                      present: attendanceDays,
                      late: lateAttendanceDays,
                      today: [new Date(2025, 2, 8)] // March 8, 2025
                    }}
                    defaultMonth={new Date(2025, 2, 1)} // Default to March 2025
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedFace?.name || 'Student'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <p>{selectedFace?.employee_id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Department:</span>
                      <p>{selectedFace?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Position:</span>
                      <p>{selectedFace?.position || 'Student'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total Attendance:</span>
                      <p>{attendanceDays.length + lateAttendanceDays.length} days</p>
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-2">
                        {format(selectedDate, 'MMMM d, yyyy')} Attendance
                      </h3>
                      {dailyAttendance.length > 0 ? (
                        <div className="space-y-2">
                          {dailyAttendance.map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                              <div className="flex items-center">
                                {record.status === 'late' ? (
                                  <Clock className="h-4 w-4 text-amber-500 mr-2" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                                )}
                                <span>
                                  {format(new Date(record.timestamp), 'h:mm a')}
                                </span>
                              </div>
                              <Badge variant={record.status === 'late' ? "outline" : "default"}>
                                {record.status === 'late' ? 'Late' : 'Present'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : isDateInArray(selectedDate, attendanceDays) || isDateInArray(selectedDate, lateAttendanceDays) ? (
                        <p className="text-sm text-muted-foreground">Loading attendance details...</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No attendance recorded for this date.</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
              <h3 className="text-lg font-medium mb-2">No student selected</h3>
              <p className="text-muted-foreground">
                Select a student from the list to view their attendance calendar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceCalendar;
