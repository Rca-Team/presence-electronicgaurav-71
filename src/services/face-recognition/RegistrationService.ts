
import { supabase } from '@/integrations/supabase/client';
import { descriptorToString } from './ModelService';
import { storage } from '@/integrations/supabase/client';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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
    
    // Upload image to Firebase Storage if provided
    let firebaseImageUrl = null;
    if (employeeData.image_url) {
      try {
        const imageRef = ref(storage, `student-photos/${employeeId}`);
        // Remove data URL prefix if present
        const base64Data = employeeData.image_url.includes('data:image') 
          ? employeeData.image_url.split(',')[1] 
          : employeeData.image_url;
        
        // Upload the image
        await uploadString(imageRef, base64Data, 'base64');
        
        // Get the download URL
        firebaseImageUrl = await getDownloadURL(imageRef);
        console.log('Image uploaded to Firebase Storage:', firebaseImageUrl);
      } catch (storageError) {
        console.error('Error uploading image to Firebase:', storageError);
        // Continue with registration even if image upload fails
      }
    }
    
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
      starting_year: employeeData.starting_year,
      firebase_image_url: firebaseImageUrl
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
    
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Upload unrecognized face to Firebase
    let firebaseImageUrl = null;
    try {
      const imageRef = ref(storage, `unrecognized-faces/${randomId}`);
      // Remove data URL prefix if present
      const base64Data = imageData.includes('data:image') 
        ? imageData.split(',')[1] 
        : imageData;
      
      // Upload the image
      await uploadString(imageRef, base64Data, 'base64');
      
      // Get the download URL
      firebaseImageUrl = await getDownloadURL(imageRef);
      console.log('Unrecognized face uploaded to Firebase:', firebaseImageUrl);
    } catch (storageError) {
      console.error('Error uploading unrecognized face to Firebase:', storageError);
      // Continue even if image upload fails
    }
    
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      firebase_image_url: firebaseImageUrl
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
