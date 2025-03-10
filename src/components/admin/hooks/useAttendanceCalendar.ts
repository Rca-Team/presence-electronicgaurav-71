
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchSelectedFace, 
  fetchAttendanceRecords, 
  fetchDailyAttendance,
  generateWorkingDays,
  isDateInArray,
  FaceInfo
} from '../utils/attendanceUtils';

export const useAttendanceCalendar = (selectedFaceId: string | null) => {
  const { toast } = useToast();
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [absentDays, setAbsentDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 2, 8));
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<{
    id: string;
    timestamp: string;
    status: string;
  }[]>([]);
  const [workingDays, setWorkingDays] = useState<Date[]>([]);

  // Subscribe to real-time updates
  useEffect(() => {
    let attendanceChannel: any = null;

    if (selectedFaceId) {
      fetchFaceDetails(selectedFaceId);
      loadAttendanceRecords(selectedFaceId);
      setWorkingDays(generateWorkingDays(2025, 2));

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
            loadAttendanceRecords(selectedFaceId);
            if (selectedDate) {
              loadDailyAttendance(selectedFaceId, selectedDate);
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

  // Load daily attendance when selected date changes
  useEffect(() => {
    if (selectedFaceId && selectedDate) {
      loadDailyAttendance(selectedFaceId, selectedDate);
    } else {
      setDailyAttendance([]);
    }
  }, [selectedFaceId, selectedDate]);

  // Calculate absent days
  useEffect(() => {
    if (workingDays.length > 0 && (attendanceDays.length > 0 || lateAttendanceDays.length > 0)) {
      const absent = workingDays.filter(workDay => {
        const today = new Date(2025, 2, 8);
        if (workDay > today) return false;
        
        return !isDateInArray(workDay, attendanceDays) && !isDateInArray(workDay, lateAttendanceDays);
      });
      
      setAbsentDays(absent);
    }
  }, [workingDays, attendanceDays, lateAttendanceDays]);

  // Fetch face details
  const fetchFaceDetails = async (faceId: string) => {
    try {
      const faceInfo = await fetchSelectedFace(faceId);
      setSelectedFace(faceInfo);
    } catch (error) {
      console.error('Error fetching face details:', error);
      toast({
        title: "Error",
        description: "Failed to load face details",
        variant: "destructive"
      });
    }
  };

  // Load attendance records
  const loadAttendanceRecords = async (faceId: string) => {
    try {
      setLoading(true);
      await fetchAttendanceRecords(faceId, setAttendanceDays, setLateAttendanceDays);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load daily attendance
  const loadDailyAttendance = async (faceId: string, date: Date) => {
    try {
      await fetchDailyAttendance(faceId, date, setDailyAttendance);
    } catch (error) {
      console.error('Error loading daily attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load daily attendance details",
        variant: "destructive"
      });
    }
  };

  return {
    attendanceDays,
    lateAttendanceDays,
    absentDays,
    selectedFace,
    selectedDate,
    setSelectedDate,
    loading,
    dailyAttendance,
    workingDays,
    isDateInArray
  };
};
