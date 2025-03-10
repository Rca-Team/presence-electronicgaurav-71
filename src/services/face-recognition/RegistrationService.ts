
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from './StorageService';
import { v4 as uuidv4 } from 'uuid';

export const registerFace = async (
  imageBlob: Blob,
  name: string,
  employee_id: string,
  department: string,
  position: string,
  userId: string | undefined
): Promise<any> => {
  try {
    const imageUrl = await uploadFaceImage(imageBlob);

    // Get device info
    const deviceInfo = await getDeviceInfo(name, employee_id, department, position);

    // Insert attendance record
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert([
        {
          user_id: userId,
          timestamp: new Date().toISOString(),
          status: 'present',
          device_info: deviceInfo,
          image_url: imageUrl,
        },
      ])
      .select()
      .single();

    if (attendanceError) {
      throw new Error(`Error inserting attendance record: ${attendanceError.message}`);
    }

    return attendanceRecord;
  } catch (error: any) {
    console.error('Face registration failed:', error);
    throw error;
  }
};

const getDeviceInfo = async (
  name: string,
  employee_id: string,
  department: string,
  position: string
): Promise<any> => {
  return {
    type: 'webcam',
    metadata: {
      name: name,
      employee_id: employee_id,
      department: department,
      position: position,
    },
  };
};

export const uploadFaceImage = async (imageBlob: Blob): Promise<string> => {
  try {
    const file = new File([imageBlob], `face_${uuidv4()}.jpg`, { type: 'image/jpeg' });
    const filePath = `faces/${uuidv4()}.jpg`;
    
    // Use our new uploadImage function
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
