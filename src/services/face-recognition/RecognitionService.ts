
import { supabase } from '@/integrations/supabase/client';
import { recordAttendanceToFirebase } from '../firebase/attendanceService';

/**
 * Recognizes a face based on the provided descriptor
 */
export const recognizeFace = async (faceDescriptor: Float32Array) => {
  try {
    // First check if face is registered in our database by checking registration records
    const { data: registrationRecords, error } = await supabase
      .from('attendance_records')
      .select('*')
      .contains('device_info', { registration: true });
      
    if (error) throw error;
    
    // If no registration records, cannot recognize anyone
    if (!registrationRecords || registrationRecords.length === 0) {
      console.log('No registered faces found in database');
      return { recognized: false };
    }
    
    // Find the employee with the closest matching face descriptor
    let closestMatch = null;
    let minDistance = Infinity;
    
    for (const record of registrationRecords) {
      // For each registration record, check if it has device_info with face_descriptor
      const deviceInfo = record.device_info as any;
      const metadata = deviceInfo?.metadata || {};
      
      if (!metadata.face_descriptor) continue;
      
      try {
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = new Float32Array(
          Object.values(JSON.parse(metadata.face_descriptor))
        );
        
        // Calculate Euclidean distance between descriptors
        const distance = euclideanDistance(faceDescriptor, storedDescriptor);
        
        // Update closest match if this is better
        if (distance < minDistance) {
          minDistance = distance;
          closestMatch = {
            id: metadata.employee_id || record.id,
            name: metadata.name || 'Unknown',
            department: metadata.department || 'Unknown',
            position: metadata.position || 'Unknown',
            firebase_image_url: metadata.firebase_image_url || null
          };
        }
      } catch (parseError) {
        console.error('Error parsing face descriptor:', parseError);
        continue;
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
    // Get employee details from attendance_records
    const { data: employeeData, error: employeeError } = await supabase
      .from('attendance_records')
      .select('*')
      .contains('device_info', { metadata: { employee_id: userId } })
      .single();
    
    let employeeName = 'Unknown';
    let imageUrl = null;
    
    if (!employeeError && employeeData) {
      const deviceInfo = employeeData.device_info as any;
      const metadata = deviceInfo?.metadata || {};
      employeeName = metadata.name || 'Unknown';
      imageUrl = metadata.firebase_image_url || null;
    }
    
    // First, record in Supabase
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          user_id: null, // Using null to avoid foreign key constraints
          status,
          timestamp,
          confidence_score: confidenceScore,
          device_info: {
            metadata: {
              timestamp,
              employee_id: userId,
              device: navigator.userAgent
            }
          }
        }
      ]);
      
    if (error) throw error;
    
    // Then, record in Firebase Realtime Database
    await recordAttendanceToFirebase(
      userId,
      status === 'present' ? 'present' : 'late', // Convert 'unauthorized' to 'late' for Firebase
      confidenceScore,
      employeeName,
      imageUrl
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
