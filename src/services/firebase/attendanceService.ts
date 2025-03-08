
import { ref, set, onValue, push, serverTimestamp, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/integrations/firebase/config";
import { format } from "date-fns";

// Record attendance to Firebase
export const recordAttendanceToFirebase = async (
  userId: string, 
  status: 'present' | 'late' | 'unauthorized',
  confidenceScore: number,
  name: string,
  imageUrl?: string
) => {
  try {
    // Get current date in YYYY-MM-DD format for organizing data
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Create a timestamp for the attendance record
    const timestamp = new Date().toISOString();
    
    // Create a reference to the specific location in the database
    const attendanceRef = ref(database, `attendance/${today}/${userId}`);
    
    // Data to be stored
    const attendanceData = {
      status,
      timestamp,
      confidenceScore: confidenceScore || 0,
      updatedAt: serverTimestamp(),
      name,
      imageUrl: imageUrl || null
    };
    
    // Set the data
    await set(attendanceRef, attendanceData);
    
    // Also add to attendance history for this user
    const historyRef = push(ref(database, `attendanceHistory/${userId}`));
    await set(historyRef, {
      ...attendanceData,
      date: today
    });
    
    console.log('Attendance recorded to Firebase successfully');
    return true;
  } catch (error) {
    console.error('Error recording attendance to Firebase:', error);
    return false;
  }
};

// Get today's attendance
export const getTodayAttendance = (callback: (data: any) => void) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const attendanceRef = ref(database, `attendance/${today}`);
  
  return onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
};

// Get attendance for a specific date
export const getAttendanceByDate = (date: string, callback: (data: any) => void) => {
  const attendanceRef = ref(database, `attendance/${date}`);
  
  return onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
};

// Get attendance history for a specific user
export const getUserAttendanceHistory = (userId: string, callback: (data: any[]) => void) => {
  const historyRef = ref(database, `attendanceHistory/${userId}`);
  
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val() || {};
    const historyArray = Object.entries(data).map(([key, value]) => ({
      id: key,
      ...(value as any)
    }));
    
    // Sort by timestamp in descending order
    historyArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    callback(historyArray);
  });
};

// Gets user attendance status for a specific date
export const getUserAttendanceForDate = (userId: string, date: string, callback: (data: any) => void) => {
  const attendanceRef = ref(database, `attendance/${date}/${userId}`);
  
  return onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

// Get all user attendance history across dates (for calendar view)
export const getAllUserAttendance = (userId: string, callback: (presentDays: Date[], lateDays: Date[], absentDays: Date[]) => void) => {
  const historyRef = ref(database, `attendanceHistory/${userId}`);
  
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    const attendanceMap = new Map<string, {status: string, timestamp: string}>();
    
    // Process the attendance records
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      const dateKey = value.date;
      const existingRecord = attendanceMap.get(dateKey);
      
      // If we don't have a record for this date yet, or this record is 'present' (which overrides 'late')
      if (!existingRecord || value.status === 'present') {
        attendanceMap.set(dateKey, {
          status: value.status,
          timestamp: value.timestamp
        });
      }
    });
    
    // Prepare the result arrays
    const presentDays: Date[] = [];
    const lateDays: Date[] = [];
    
    // Fill the arrays based on status
    attendanceMap.forEach((record, dateStr) => {
      const date = new Date(dateStr);
      if (record.status === 'present') {
        presentDays.push(date);
      } else if (record.status === 'late') {
        lateDays.push(date);
      }
    });
    
    // For absent days, we'll calculate them in the calling component
    callback(presentDays, lateDays, []);
  });
};
