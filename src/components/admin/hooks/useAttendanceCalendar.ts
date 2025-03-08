
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchSelectedFace, 
  generateWorkingDays,
  isDateInArray,
  FaceInfo
} from '../utils/attendanceUtils';
import {
  getAllUserAttendance,
  getUserAttendanceForDate
} from '@/services/firebase/attendanceService';

export const useAttendanceCalendar = (selectedFaceId: string | null) => {
  const { toast } = useToast();
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [absentDays, setAbsentDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  // Set selected date to the current date for demo (March 8, 2025)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 2, 8));
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<{
    id: string;
    timestamp: string;
    status: string;
  }[]>([]);
  const [workingDays, setWorkingDays] = useState<Date[]>([]);

  // Load attendance records from Firebase
  const loadAttendanceRecords = useCallback((faceId: string) => {
    try {
      setLoading(true);
      console.log('Loading attendance records for face ID:', faceId);
      
      // Unsubscribe reference
      let unsubscribe: () => void;
      
      // Get all attendance for this user from Firebase
      unsubscribe = getAllUserAttendance(
        faceId, 
        (presentDays, lateDays, absentDaysData) => {
          console.log('Firebase attendance loaded - Present days:', presentDays.length);
          console.log('Firebase attendance loaded - Late days:', lateDays.length);
          setAttendanceDays(presentDays);
          setLateAttendanceDays(lateDays);
          setLoading(false);
        }
      );
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error loading attendance records from Firebase:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive"
      });
      setLoading(false);
      return () => {};
    }
  }, [toast]);

  // Load daily attendance from Firebase
  const loadDailyAttendance = useCallback((faceId: string, date: Date) => {
    try {
      console.log('Loading daily attendance for date:', date);
      
      const formattedDate = date.toISOString().split('T')[0];
      
      // Unsubscribe reference
      let unsubscribe: () => void;
      
      // Get attendance for this user on this specific date
      unsubscribe = getUserAttendanceForDate(
        faceId, 
        formattedDate,
        (data) => {
          if (data) {
            console.log('Daily attendance data from Firebase:', data);
            setDailyAttendance([{
              id: faceId,
              timestamp: data.timestamp,
              status: data.status
            }]);
          } else {
            console.log('No daily attendance found for this date');
            setDailyAttendance([]);
          }
        }
      );
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error loading daily attendance from Firebase:', error);
      toast({
        title: "Error",
        description: "Failed to load daily attendance details",
        variant: "destructive"
      });
      return () => {};
    }
  }, [toast]);

  // Set up face details and attendance data
  useEffect(() => {
    let unsubscribeAttendance: () => void = () => {};
    
    if (selectedFaceId) {
      const fetchFaceDetails = async (faceId: string) => {
        try {
          const faceInfo = await fetchSelectedFace(faceId);
          setSelectedFace(faceInfo);
          console.log('Face details loaded:', faceInfo);
        } catch (error) {
          console.error('Error fetching face details:', error);
          toast({
            title: "Error",
            description: "Failed to load face details",
            variant: "destructive"
          });
        }
      };

      fetchFaceDetails(selectedFaceId);
      unsubscribeAttendance = loadAttendanceRecords(selectedFaceId);
      setWorkingDays(generateWorkingDays(2025, 2));

      console.log('Set up Firebase listeners for attendance data');
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      setAbsentDays([]);
    }

    return () => {
      unsubscribeAttendance();
      console.log('Cleaned up Firebase listeners');
    };
  }, [selectedFaceId, loadAttendanceRecords, toast]);

  // Load daily attendance when selected date changes
  useEffect(() => {
    let unsubscribeDailyAttendance: () => void = () => {};
    
    if (selectedFaceId && selectedDate) {
      unsubscribeDailyAttendance = loadDailyAttendance(selectedFaceId, selectedDate);
    } else {
      setDailyAttendance([]);
    }
    
    return () => {
      unsubscribeDailyAttendance();
    };
  }, [selectedFaceId, selectedDate, loadDailyAttendance]);

  // Calculate absent days
  useEffect(() => {
    if (workingDays.length > 0 && (attendanceDays.length > 0 || lateAttendanceDays.length > 0)) {
      const today = new Date(2025, 2, 8); // Set to current date in demo (March 8, 2025)
      
      const absent = workingDays.filter(workDay => {
        // Only consider days up to today
        if (workDay > today) return false;
        
        // A day is absent if it's not in attendanceDays and not in lateAttendanceDays
        return !isDateInArray(workDay, attendanceDays) && !isDateInArray(workDay, lateAttendanceDays);
      });
      
      setAbsentDays(absent);
      console.log('Absent days calculated:', absent.length);
    }
  }, [workingDays, attendanceDays, lateAttendanceDays]);

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
