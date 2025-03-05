
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';
import { stringToDescriptor } from './ModelService';

// Define interface for the device info structure
interface DeviceInfo {
  metadata?: {
    name?: string;
    department?: string;
    position?: string;
    employee_id?: string;
    firebase_image_url?: string;
    face_descriptor?: string;
  };
  employee_id?: string;
  userAgent?: string;
  timestamp?: string;
  registration?: boolean;
}

// Fixed approach: Recognize face from attendance records with registration=true
export async function recognizeFace(faceDescriptor: Float32Array): Promise<{ 
  recognized: boolean;
  employee?: any;
  confidence?: number;
}> {
  try {
    console.log('Attempting to recognize face...');
    
    // Get all attendance records with registration=true in the device_info
    const { data: registrations, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('status', 'present');
    
    if (error) {
      console.error('Error fetching registered faces:', error);
      return { recognized: false };
    }
    
    if (!registrations || registrations.length === 0) {
      console.log('No registered faces found');
      return { recognized: false };
    }
    
    // Filter to only include registration records
    const registrationRecords = registrations.filter(record => 
      record.device_info && 
      record.device_info.registration === true &&
      record.device_info.metadata && 
      record.device_info.metadata.face_descriptor
    );
    
    if (registrationRecords.length === 0) {
      console.log('No face registration records found in the database');
      return { recognized: false };
    }
    
    console.log(`Found ${registrationRecords.length} registered faces to compare against`);
    
    // Array to store matches with confidence scores
    const matches: Array<{ employee: any; confidence: number }> = [];
    
    // Loop through registrations and compare face descriptors
    for (const registration of registrationRecords) {
      // Safely cast device_info to our interface
      const deviceInfo = registration.device_info as DeviceInfo;
      
      // Skip if metadata is missing
      if (!deviceInfo.metadata) {
        continue;
      }
      
      // Skip if face descriptor is missing
      if (!deviceInfo.metadata.face_descriptor) {
        continue;
      }
      
      try {
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = stringToDescriptor(deviceInfo.metadata.face_descriptor);
        
        // Calculate distance between current face and stored face
        const distance = faceapi.euclideanDistance(faceDescriptor, storedDescriptor);
        
        // Convert distance to confidence (1.0 - distance), lower distance = higher confidence
        const confidence = Math.max(0, 1 - distance);
        
        console.log(`Face comparison result - Name: ${deviceInfo.metadata.name}, Distance: ${distance}, Confidence: ${confidence}`);
        
        // If confidence is above threshold, consider it a match
        if (confidence > 0.6) {
          matches.push({
            employee: {
              id: deviceInfo.employee_id,
              name: deviceInfo.metadata.name,
              department: deviceInfo.metadata.department,
              position: deviceInfo.metadata.position,
              employee_id: deviceInfo.metadata.employee_id,
              firebase_image_url: deviceInfo.metadata.firebase_image_url
            },
            confidence
          });
        }
      } catch (descriptorError) {
        console.error('Error processing face descriptor:', descriptorError);
        continue; // Skip this record and try the next one
      }
    }
    
    // If we have matches, return the one with highest confidence
    if (matches.length > 0) {
      // Sort by confidence (highest first)
      matches.sort((a, b) => b.confidence - a.confidence);
      
      const bestMatch = matches[0];
      console.log('Face recognized successfully:', bestMatch.employee.name, 'with confidence:', bestMatch.confidence);
      
      return {
        recognized: true,
        employee: bestMatch.employee,
        confidence: bestMatch.confidence
      };
    }
    
    console.log('No matching face found above confidence threshold');
    return { recognized: false };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return { recognized: false };
  }
}

// Record attendance in the database
export async function recordAttendance(
  userId: string, 
  status: 'present' | 'unauthorized',
  confidenceScore: number = 1.0
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: userId,
        status,
        confidence_score: confidenceScore,
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('Error recording attendance:', error);
      return false;
    }
    
    console.log('Attendance recorded successfully');
    return true;
  } catch (error) {
    console.error('Error in recordAttendance function:', error);
    return false;
  }
}
