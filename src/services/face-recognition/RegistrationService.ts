
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from './StorageService';
import { v4 as uuidv4 } from 'uuid';
import { descriptorToString } from './ModelService';

// Define an interface for the metadata to ensure type safety
interface RegistrationMetadata {
  name: string;
  employee_id: string;
  department: string;
  position: string;
  firebase_image_url: string;
  faceDescriptor?: string; // Make this optional since it's added conditionally
}

export const registerFace = async (
  imageBlob: Blob,
  name: string,
  employee_id: string,
  department: string,
  position: string,
  userId: string | undefined,
  faceDescriptor?: Float32Array
): Promise<any> => {
  try {
    // Upload face image to storage
    const imageUrl = await uploadFaceImage(imageBlob);
    
    // Get device info with metadata
    const deviceInfo = {
      type: 'webcam',
      registration: true,
      metadata: {
        name,
        employee_id,
        department,
        position,
        firebase_image_url: imageUrl
      } as RegistrationMetadata, // Type assertion here
      timestamp: new Date().toISOString()
    };

    // If we have a face descriptor, store it as well
    if (faceDescriptor) {
      deviceInfo.metadata.faceDescriptor = descriptorToString(faceDescriptor);
    }

    // Insert registration record
    const { data: recordData, error: recordError } = await supabase
      .from('attendance_records')
      .insert([
        {
          user_id: userId,
          timestamp: new Date().toISOString(),
          status: 'registered',
          device_info: deviceInfo,
          image_url: imageUrl,
        },
      ])
      .select()
      .single();

    if (recordError) {
      throw new Error(`Error inserting attendance record: ${recordError.message}`);
    }

    return recordData;
  } catch (error: any) {
    console.error('Face registration failed:', error);
    throw error;
  }
};

export const uploadFaceImage = async (imageBlob: Blob): Promise<string> => {
  try {
    const file = new File([imageBlob], `face_${uuidv4()}.jpg`, { type: 'image/jpeg' });
    const filePath = `faces/${uuidv4()}.jpg`;
    
    // Use our storage service upload function
    const publicUrl = await uploadImage(file, filePath);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading face image:', error);
    throw error;
  }
};

// Add the missing storeUnrecognizedFace function
export const storeUnrecognizedFace = async (imageData: string): Promise<void> => {
  try {
    console.log('Storing unrecognized face');
    
    // Convert base64 image data to a Blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    // Upload the image
    const imageUrl = await uploadFaceImage(blob);
    
    // Create a device info object with the current timestamp
    const deviceInfo = {
      type: 'webcam',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      firebase_image_url: imageUrl,
    };
    
    // Insert a record with status "unauthorized"
    const { error } = await supabase
      .from('attendance_records')
      .insert([
        {
          user_id: null, // No user associated
          status: 'unauthorized',
          device_info: deviceInfo,
          image_url: imageUrl,
        }
      ]);
    
    if (error) {
      console.error('Error storing unrecognized face:', error);
    }
  } catch (error) {
    console.error('Failed to store unrecognized face:', error);
  }
};
