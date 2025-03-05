
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
    
    // Upload image to Firebase Storage if provided
    let firebaseImageUrl = null;
    if (employeeData.image_url) {
      try {
        console.log('Attempting to upload image to Firebase');
        // Store in face-auth folder
        const imageRef = ref(storage, `face-auth/${employeeId}`);
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
    
    // Store employee metadata in a transaction record
    const metadataRecord = {
      employee_id: employeeData.employee_id,
      department: employeeData.department,
      position: employeeData.position,
      year: employeeData.year,
      major: employeeData.major,
      standing: employeeData.standing,
      starting_year: employeeData.starting_year,
      firebase_image_url: firebaseImageUrl,
      name: employeeData.name,
      face_descriptor: descriptorToString(faceDescriptor) // Store face descriptor in metadata
    };
    
    // Record attendance to mark registration
    console.log('Storing registration in Supabase with status: present');
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        user_id: null, // Use null to avoid foreign key constraints
        status: 'present', // Use 'present' instead of 'registered' to match DB constraints
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          registration: true,
          metadata: metadataRecord,
          employee_id: employeeId // Store the generated UUID here
        },
        confidence_score: 1.0
      });
    
    if (attendanceError) {
      console.error('Error recording registration in Supabase:', attendanceError);
      return false;
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
      console.log('Attempting to upload unrecognized face to Firebase');
      // Store in face-auth/unrecognized folder
      const imageRef = ref(storage, `face-auth/unrecognized/${randomId}`);
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
    
    console.log('Storing unrecognized face in Supabase with status: unauthorized');
    // Use 'unauthorized' status which should be allowed by the DB constraints
    const { error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: null,
        status: 'unauthorized',
        device_info: deviceInfo
      });
      
    if (error) {
      console.error('Error storing unrecognized face in Supabase:', error);
      return false;
    }
    
    console.log('Unrecognized face stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing unrecognized face:', error);
    return false;
  }
}
