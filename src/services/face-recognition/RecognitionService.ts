
import { supabase } from '@/integrations/supabase/client';
import { recordAttendanceToFirebase } from '../firebase/attendanceService';

/**
 * Recognizes a face based on the provided descriptor
 */
export const recognizeFace = async (faceDescriptor: Float32Array) => {
  try {
    // First check if face is registered in our database
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*');
      
    if (error) throw error;
    
    // If no employees, cannot recognize anyone
    if (!employees || employees.length === 0) {
      console.log('No employees found in database');
      return { recognized: false };
    }
    
    // Find the employee with the closest matching face descriptor
    let closestMatch = null;
    let minDistance = Infinity;
    
    for (const employee of employees) {
      if (!employee.face_descriptor) continue;
      
      // Convert stored descriptor back to Float32Array
      const storedDescriptor = new Float32Array(
        Object.values(JSON.parse(employee.face_descriptor))
      );
      
      // Calculate Euclidean distance between descriptors
      const distance = euclideanDistance(faceDescriptor, storedDescriptor);
      
      // Update closest match if this is better
      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = employee;
      }
    }
    
    // Threshold for face recognition (lower = stricter)
    const threshold = 0.6;
    
    if (closestMatch && minDistance < threshold) {
      console.log(`Face recognized as ${closestMatch.name} with distance ${minDistance}`);
      return { 
        recognized: true, 
        employee: closestMatch,
        confidence: 1 - minDistance  // Higher value = more confident
      };
    } else {
      console.log('Face not recognized, minimum distance:', minDistance);
      return { recognized: false };
    }
  } catch (error) {
    console.error('Error during face recognition:', error);
    throw error;
  }
};

/**
 * Records attendance in the database
 */
export const recordAttendance = async (
  userId: string, 
  status: 'present' | 'unauthorized' = 'present',
  confidenceScore = 1.0
) => {
  const timestamp = new Date().toISOString();
  
  try {
    // First, record in Supabase
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          user_id: userId,
          status,
          timestamp,
          confidence_score: confidenceScore,
          device_info: {
            metadata: {
              timestamp,
              device: navigator.userAgent
            }
          }
        }
      ]);
      
    if (error) throw error;
    
    // Get employee details for Firebase
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('name, firebase_image_url')
      .eq('id', userId)
      .single();
      
    if (employeeError) throw employeeError;
    
    // Then, record in Firebase Realtime Database
    await recordAttendanceToFirebase(
      userId,
      status === 'present' ? 'present' : 'late', // Convert 'unauthorized' to 'late' for Firebase
      confidenceScore,
      employeeData?.name || 'Unknown',
      employeeData?.firebase_image_url
    );
    
    console.log('Attendance recorded successfully');
    return data;
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

/**
 * Helper function to calculate Euclidean distance between two descriptors
 */
const euclideanDistance = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
};
