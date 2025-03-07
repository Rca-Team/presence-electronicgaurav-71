
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Clock } from 'lucide-react';

interface AttendanceCalendarProps {
  selectedFaceId: string | null;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedFaceId }) => {
  const { toast } = useToast();
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  const dayClassName = (date: Date) => {
    if (isDateInArray(date, lateAttendanceDays)) {
      return "bg-amber-500 text-white hover:bg-amber-600";
    }
    if (isDateInArray(date, attendanceDays)) {
      return "bg-green-500 text-white hover:bg-green-600";
    }
    return "";
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
      const { data, error } = await supabase
        .from('registered_faces')
        .select('*')
        .eq('id', faceId)
        .single();

      if (error) {
        console.error('Error fetching face details:', error);
        // Try fetching from attendance_records as fallback
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('id', faceId)
          .single();
          
        if (attendanceError) throw attendanceError;
        
        if (attendanceData) {
          const deviceInfo = attendanceData.device_info as any;
          const metadata = deviceInfo?.metadata || {};
          
          setSelectedFace({
            name: metadata.name || 'Unknown',
            employee_id: metadata.employee_id || 'N/A',
            department: metadata.department || 'N/A',
            position: metadata.position || 'Student',
          });
          return;
        }
      }

      if (data) {
        setSelectedFace({
          name: data.name || 'Unknown',
          employee_id: data.employee_id || 'N/A',
          department: data.department || 'N/A',
          position: data.position || 'Student',
        });
      }
    } catch (error) {
      console.error('Error fetching face details:', error);
      toast({
        title: "Error",
        description: "Failed to load face details",
        variant: "destructive"
      });
    }
  };

  const fetchAttendanceRecords = async (faceId: string) => {
    try {
      setLoading(true);
      console.log('Fetching attendance records for face ID:', faceId);
      
      // First, try to get face details to find the employee_id
      let employeeId: string | null = null;
      
      // Try registered_faces table first
      const { data: faceData, error: faceError } = await supabase
        .from('registered_faces')
        .select('employee_id')
        .eq('id', faceId)
        .single();
      
      if (!faceError && faceData?.employee_id) {
        employeeId = faceData.employee_id;
        console.log('Found employee_id in registered_faces:', employeeId);
      } else {
        // If not found, try attendance_records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('device_info')
          .eq('id', faceId)
          .single();
        
        if (!attendanceError && attendanceData?.device_info) {
          const deviceInfo = attendanceData.device_info as any;
          employeeId = deviceInfo?.metadata?.employee_id || null;
          console.log('Found employee_id in attendance_records:', employeeId);
        }
      }
      
      if (!employeeId) {
        console.log('No employee_id found for face ID:', faceId);
        // Try using the face ID directly as a fallback
        employeeId = faceId;
      }
      
      // Now fetch all attendance records for this employee
      const { data: recordsPresent, error: errorPresent } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('status', 'present')
        .or(`device_info->metadata->employee_id.eq.${employeeId},user_id.eq.${faceId}`);
      
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
        .or(`device_info->metadata->employee_id.eq.${employeeId},user_id.eq.${faceId}`);
      
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
      
      // First, try to get face details to find the employee_id
      let employeeId: string | null = null;
      
      // Try registered_faces table first
      const { data: faceData, error: faceError } = await supabase
        .from('registered_faces')
        .select('employee_id')
        .eq('id', faceId)
        .single();
      
      if (!faceError && faceData?.employee_id) {
        employeeId = faceData.employee_id;
      } else {
        // If not found, try attendance_records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('device_info')
          .eq('id', faceId)
          .single();
        
        if (!attendanceError && attendanceData?.device_info) {
          const deviceInfo = attendanceData.device_info as any;
          employeeId = deviceInfo?.metadata?.employee_id || null;
        }
      }
      
      if (!employeeId) {
        // Try using the face ID directly as a fallback
        employeeId = faceId;
      }
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('id, timestamp, status')
        .or(`device_info->metadata->employee_id.eq.${employeeId},user_id.eq.${faceId}`)
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
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiersClassNames={{
                      selected: "bg-primary",
                    }}
                    modifiersStyles={{
                      selected: { 
                        fontWeight: 'bold' 
                      },
                      present: { 
                        backgroundColor: "rgb(34, 197, 94)", 
                        color: "white"
                      },
                      late: { 
                        backgroundColor: "rgb(245, 158, 11)", 
                        color: "white"
                      }
                    }}
                    classNames={{
                      day: "relative inline-flex items-center justify-center"
                    }}
                    modifiers={{
                      present: attendanceDays,
                      late: lateAttendanceDays
                    }}
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
