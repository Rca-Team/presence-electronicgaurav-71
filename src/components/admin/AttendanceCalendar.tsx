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

  // Function to check if a date exists in an array of dates
  const isDateInArray = (date: Date, dateArray: Date[]): boolean => {
    return dateArray.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  // Custom day rendering
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

      // Set up real-time subscription for attendance updates
      attendanceChannel = supabase
        .channel(`attendance-calendar-${selectedFaceId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'attendance_records'
          }, 
          () => {
            console.log('Real-time update received for attendance calendar');
            fetchAttendanceRecords(selectedFaceId);
          }
        )
        .subscribe();
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
    }

    // Clean up subscription on unmount or when selectedFaceId changes
    return () => {
      if (attendanceChannel) {
        supabase.removeChannel(attendanceChannel);
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
        .from('attendance_records')
        .select('*')
        .eq('id', faceId)
        .single();

      if (error) throw error;

      if (data) {
        const deviceInfo = data.device_info as any;
        const metadata = deviceInfo?.metadata || {};
        
        setSelectedFace({
          name: metadata.name || 'Unknown',
          employee_id: metadata.employee_id || 'N/A',
          department: metadata.department || 'N/A',
          position: metadata.position || 'Student',
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
      
      // First, get the employee_id associated with this face
      const { data: faceData, error: faceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', faceId)
        .single();
      
      if (faceError) throw faceError;
      
      if (!faceData || !faceData.device_info) {
        setAttendanceDays([]);
        setLateAttendanceDays([]);
        return;
      }
      
      const deviceInfo = faceData.device_info as any;
      const employeeId = deviceInfo?.metadata?.employee_id;
      
      if (!employeeId) {
        setAttendanceDays([]);
        setLateAttendanceDays([]);
        return;
      }
      
      // Then, get all attendance records for this employee_id
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .contains('device_info', { employee_id: employeeId })
        .eq('status', 'present');
        
      if (error) throw error;
      
      // Get late attendance records
      const { data: lateRecords, error: lateError } = await supabase
        .from('attendance_records')
        .select('*')
        .contains('device_info', { employee_id: employeeId })
        .eq('status', 'late');
        
      if (lateError) throw lateError;
      
      // Process present attendance records
      if (records) {
        const days = records.map(record => 
          record.timestamp ? new Date(record.timestamp) : null
        ).filter(date => date !== null) as Date[];
        
        setAttendanceDays(days);
      }
      
      // Process late attendance records
      if (lateRecords) {
        const lateDays = lateRecords.map(record => 
          record.timestamp ? new Date(record.timestamp) : null
        ).filter(date => date !== null) as Date[];
        
        setLateAttendanceDays(lateDays);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
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
      // First, get the employee_id associated with this face
      const { data: faceData, error: faceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', faceId)
        .single();
      
      if (faceError) throw faceError;
      
      if (!faceData || !faceData.device_info) {
        setDailyAttendance([]);
        return;
      }
      
      const deviceInfo = faceData.device_info as any;
      const employeeId = deviceInfo?.metadata?.employee_id;
      
      if (!employeeId) {
        setDailyAttendance([]);
        return;
      }
      
      // Format the date for querying
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get all attendance records for this employee_id on the selected date
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('id, timestamp, status')
        .contains('device_info', { employee_id: employeeId })
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      if (records) {
        setDailyAttendance(records);
      }
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
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
                      }
                    }}
                    components={{
                      Day: ({ date, ...props }) => {
                        const customClassName = dayClassName(date);
                        return (
                          <button
                            {...props}
                            className={`${props.className || ''} ${customClassName}`}
                          />
                        );
                      }
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
