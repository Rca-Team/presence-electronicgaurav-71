import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import CalendarLegend from './CalendarLegend';
import StudentInfoCard from './StudentInfoCard';
import DailyAttendanceDetails from './DailyAttendanceDetails';

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
  const [absentDays, setAbsentDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 2, 8)); // March 8, 2025
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<{
    id: string;
    timestamp: string;
    status: string;
  }[]>([]);
  const [workingDays, setWorkingDays] = useState<Date[]>([]);

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
      generateWorkingDays();

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
      setAbsentDays([]);
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

  // Generate working days (for the current month)
  const generateWorkingDays = () => {
    const currentYear = 2025;
    const currentMonth = 2; // March (0-based)
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Generate dates for all weekdays (Monday-Friday) in the current month
    const days: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Add Monday through Friday (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(date);
      }
    }
    
    setWorkingDays(days);
  };

  // Calculate absent days based on working days minus present/late days
  useEffect(() => {
    if (workingDays.length > 0 && (attendanceDays.length > 0 || lateAttendanceDays.length > 0)) {
      // Find days in workingDays that are not in attendanceDays or lateAttendanceDays
      const absent = workingDays.filter(workDay => {
        // Filter out future dates (after today - March 8, 2025)
        const today = new Date(2025, 2, 8);
        if (workDay > today) return false;
        
        return !isDateInArray(workDay, attendanceDays) && !isDateInArray(workDay, lateAttendanceDays);
      });
      
      setAbsentDays(absent);
    }
  }, [workingDays, attendanceDays, lateAttendanceDays]);

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

  // Print attendance report
  const handlePrintReport = () => {
    if (!selectedFace) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive"
      });
      return;
    }

    // Format date for the report
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Count attendance statistics
    const totalWorkDays = workingDays.filter(date => {
      const today = new Date(2025, 2, 8); // March 8, 2025
      return date <= today;
    }).length;
    
    const presentCount = attendanceDays.length;
    const lateCount = lateAttendanceDays.length;
    const absentCount = absentDays.length;
    const attendanceRate = ((presentCount + lateCount) / totalWorkDays * 100).toFixed(1);

    // Generate HTML content for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - ${selectedFace.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3 {
              color: #2563eb;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .summary {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 30px;
            }
            .status-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              margin-left: 5px;
            }
            .status-present {
              background-color: #10b981;
            }
            .status-late {
              background-color: #f59e0b;
            }
            .status-absent {
              background-color: #ef4444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
            }
            @media print {
              body {
                font-size: 12pt;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <p>Generated on ${formatDate(new Date(2025, 2, 8))}</p>
          </div>
          
          <h2>Student Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Name:</div>
              <div>${selectedFace.name}</div>
            </div>
            <div class="info-item">
              <div class="label">ID:</div>
              <div>${selectedFace.employee_id}</div>
            </div>
            <div class="info-item">
              <div class="label">Department:</div>
              <div>${selectedFace.department}</div>
            </div>
            <div class="info-item">
              <div class="label">Position:</div>
              <div>${selectedFace.position}</div>
            </div>
          </div>
          
          <h2>Attendance Summary</h2>
          <div class="summary">
            <div class="info-item">
              <div class="label">Total Working Days (to date):</div>
              <div>${totalWorkDays}</div>
            </div>
            <div class="info-item">
              <div class="label">Present Days:</div>
              <div>${presentCount} <span class="status-badge status-present">Present</span></div>
            </div>
            <div class="info-item">
              <div class="label">Late Days:</div>
              <div>${lateCount} <span class="status-badge status-late">Late</span></div>
            </div>
            <div class="info-item">
              <div class="label">Absent Days:</div>
              <div>${absentCount} <span class="status-badge status-absent">Absent</span></div>
            </div>
            <div class="info-item">
              <div class="label">Attendance Rate:</div>
              <div>${attendanceRate}%</div>
            </div>
          </div>
          
          <h2>Attendance Details</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Time (if present)</th>
              </tr>
            </thead>
            <tbody>
              ${workingDays
                .filter(date => {
                  const today = new Date(2025, 2, 8); // March 8, 2025
                  return date <= today;
                })
                .sort((a, b) => b.getTime() - a.getTime()) // Newest first
                .map(date => {
                  const isPresent = isDateInArray(date, attendanceDays);
                  const isLate = isDateInArray(date, lateAttendanceDays);
                  const isAbsent = isDateInArray(date, absentDays);
                  
                  // Find time from dailyAttendance if it's the selected date
                  let attendanceTime = '';
                  if ((isPresent || isLate) && 
                      date.getDate() === selectedDate?.getDate() && 
                      date.getMonth() === selectedDate?.getMonth() && 
                      date.getFullYear() === selectedDate?.getFullYear() && 
                      dailyAttendance.length > 0) {
                    const firstRecord = dailyAttendance[0];
                    const recordTime = new Date(firstRecord.timestamp);
                    attendanceTime = recordTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  }
                  
                  let status = 'N/A';
                  let statusClass = '';
                  
                  if (isPresent) {
                    status = 'Present';
                    statusClass = 'status-present';
                  } else if (isLate) {
                    status = 'Late';
                    statusClass = 'status-late';
                  } else if (isAbsent) {
                    status = 'Absent';
                    statusClass = 'status-absent';
                  }
                  
                  return `
                    <tr>
                      <td>${formatDate(date)}</td>
                      <td><span class="status-badge ${statusClass}">${status}</span></td>
                      <td>${(isPresent || isLate) ? attendanceTime || 'N/A' : '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()">Print Report</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto-print (optional)
    // printWindow.print();
    
    toast({
      title: "Report Generated",
      description: "Attendance report has been generated in a new tab.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      {selectedFaceId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Attendance Calendar</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrintReport}
                  className="flex items-center gap-2"
                  title="Print Attendance Report"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print Report</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <CalendarLegend />
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
                      absent: {
                        backgroundColor: "rgb(239, 68, 68)",
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
                      absent: absentDays,
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
                  <StudentInfoCard 
                    selectedFace={selectedFace} 
                    attendanceDays={attendanceDays} 
                    lateAttendanceDays={lateAttendanceDays} 
                  />
                  
                  {selectedDate && (
                    <DailyAttendanceDetails
                      selectedDate={selectedDate}
                      dailyAttendance={dailyAttendance}
                      isDateInArray={isDateInArray}
                      attendanceDays={attendanceDays}
                      lateAttendanceDays={lateAttendanceDays}
                      absentDays={absentDays}
                    />
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
