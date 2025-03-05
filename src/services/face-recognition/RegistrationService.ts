
import { supabase } from '@/integrations/supabase/client';
import { descriptorToString } from './ModelService';

// Register a new face
export async function registerFace(
  employeeId: string, 
  faceDescriptor: Float32Array,
  employeeData: {
    name: string;
    employee_id: string;
    department: string;
    position?: string;
    year?: string;
    major?: string;
    standing?: string;
    starting_year?: string;
    image_url?: string;
  }
): Promise<boolean> {
  try {
    console.log('Registering face with ID:', employeeId);
    
    // Store user profile info in the profiles table first
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: employeeId,
        username: employeeData.name,
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error('Error storing profile information:', profileError);
      return false;
    }
    
    console.log('Profile information stored successfully');
    
    // Store face data in the face_profiles table
    const { error } = await supabase
      .from('face_profiles')
      .insert({
        user_id: employeeId, 
        face_data: descriptorToString(faceDescriptor)
      });
      
    if (error) {
      console.error('Error storing face data:', error);
      return false;
    }
    
    console.log('Face data stored successfully');
    
    // Store employee metadata in a transaction record
    const metadataRecord = {
      employee_id: employeeData.employee_id,
      department: employeeData.department,
      position: employeeData.position,
      year: employeeData.year,
      major: employeeData.major,
      standing: employeeData.standing,
      starting_year: employeeData.starting_year
    };
    
    // Record attendance to mark registration
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        user_id: employeeId,
        status: 'present',
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          registration: true,
          metadata: metadataRecord
        },
        confidence_score: 1.0
      });
    
    if (attendanceError) {
      console.error('Error recording initial attendance:', attendanceError);
      // Don't return false here, as the face data was successfully stored
    }
    
    console.log('Face registration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in registerFace function:', error);
    return false;
  }
}

// Store unrecognized face - using face_profiles with null user
export async function storeUnrecognizedFace(imageData: string): Promise<boolean> {
  try {
    console.log('Storing unrecognized face');
    
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Store in face_profiles with null user_id to mark as unrecognized
    const { error } = await supabase
      .from('face_profiles')
      .insert({
        user_id: null,
        face_data: imageData
      });
      
    if (error) {
      console.error('Error storing unrecognized face:', error);
      return false;
    }
    
    // Also record in attendance_records as unauthorized
    await supabase
      .from('attendance_records')
      .insert({
        user_id: null,
        status: 'unauthorized',
        device_info: deviceInfo
      });
    
    console.log('Unrecognized face stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing unrecognized face:', error);
    return false;
  }
}
