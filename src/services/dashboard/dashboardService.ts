
import { supabase } from '@/integrations/supabase/client';
import { processWeeklyData, processDepartmentData } from '@/utils/dashboardHelpers';

// Function to fetch attendance data from Supabase
export const fetchAttendanceStats = async () => {
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Get all attendance records
  const { data: allRecords, error: recordsError } = await supabase
    .from('attendance_records')
    .select('*');
    
  if (recordsError) throw recordsError;
  
  // Calculate totals
  const totalRecords = allRecords?.length || 0;
  const presentRecords = allRecords?.filter(rec => rec.status === 'present').length || 0;
  const unauthorizedRecords = allRecords?.filter(rec => rec.status === 'unauthorized').length || 0;
  
  // Calculate percentage values
  const presentPercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
  const unauthorizedPercentage = totalRecords > 0 ? Math.round((unauthorizedRecords / totalRecords) * 100) : 0;
  const absentPercentage = 100 - presentPercentage - unauthorizedPercentage;
  
  // Get recent week data for trend
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekISO = lastWeek.toISOString();
  
  const { data: recentRecords, error: recentError } = await supabase
    .from('attendance_records')
    .select('*')
    .gte('timestamp', lastWeekISO);
    
  if (recentError) throw recentError;
  
  // Process data for weekly chart
  const weeklyData = processWeeklyData(recentRecords || []);
  
  // Process department data
  const departmentData = processDepartmentData(allRecords || []);
  
  // Get recent activity
  const { data: recentActivity, error: activityError } = await supabase
    .from('attendance_records')
    .select('*, user_id')
    .order('timestamp', { ascending: false })
    .limit(5);
    
  if (activityError) throw activityError;
  
  return {
    totalEmployees: Math.max(20, Math.round(totalRecords * 1.2)), // Estimate total employees
    presentToday: presentRecords,
    presentPercentage,
    weeklyAverage: Math.round(presentPercentage * 0.95), // Estimated weekly average
    statusData: [
      { name: 'Present', value: presentPercentage },
      { name: 'Absent', value: absentPercentage },
      { name: 'Unauthorized', value: unauthorizedPercentage },
    ],
    weeklyData,
    departmentData,
    recentActivity,
  };
};

// Function to fetch registered faces from attendance_records
export const fetchRegisteredFaces = async () => {
  // Get records with registration=true in device_info.registration
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .filter('device_info->registration', 'eq', true);
    
  if (error) throw error;
  
  // Extract employee data from the records
  const faces = data?.map(record => {
    const deviceInfo = record.device_info as any;
    const metadata = deviceInfo?.metadata || {};
    
    return {
      id: record.id,
      name: metadata.name || 'Unknown',
      employee_id: metadata.employee_id || '',
      department: metadata.department || 'Unknown',
      position: metadata.position || '',
      timestamp: record.timestamp,
      image_url: metadata.firebase_image_url || '',
      face_descriptor: metadata.face_descriptor || '',
      record_id: record.id
    };
  }) || [];
  
  return faces;
};
