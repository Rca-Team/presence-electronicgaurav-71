
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
    // Use the face_profiles table to store face data
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
    
    // Store user profile info in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: employeeId,
        username: employeeData.name,
        // Store additional data as metadata or in another field if needed
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error('Error storing profile information:', profileError);
      return false;
    }
    
    console.log('Face and profile information stored successfully');
    return true;
  } catch (error) {
    console.error('Error registering face:', error);
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
