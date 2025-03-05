
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';
import { stringToDescriptor } from './ModelService';

// New approach: Recognize face from attendance records metadata instead of face_profiles
export async function recognizeFace(faceDescriptor: Float32Array): Promise<{ 
  recognized: boolean;
  employee?: any;
  confidence?: number;
}> {
  try {
    console.log('Attempting to recognize face...');
    
    // Get all attendance records with registration=true
    const { data: registrations, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('status', 'registered');
    
    if (error || !registrations || registrations.length === 0) {
      console.log('No registered faces found:', error);
      return { recognized: false };
    }
    
    console.log(`Found ${registrations.length} registered faces to compare against`);
    
    // Array to store matches with confidence scores
    const matches: Array<{ employee: any; confidence: number }> = [];
    
    // Loop through registrations and compare face descriptors
    for (const registration of registrations) {
      // Skip if device_info or metadata is missing
      if (!registration.device_info || !registration.device_info.metadata) {
        continue;
      }
      
      const metadata = registration.device_info.metadata;
      
      // Skip if face descriptor is missing
      if (!metadata.face_descriptor) {
        continue;
      }
      
      // Convert stored descriptor back to Float32Array
      const storedDescriptor = stringToDescriptor(metadata.face_descriptor);
      
      // Calculate distance between current face and stored face
      const distance = faceapi.euclideanDistance(faceDescriptor, storedDescriptor);
      
      // Convert distance to confidence (1.0 - distance), lower distance = higher confidence
      const confidence = Math.max(0, 1 - distance);
      
      console.log(`Face comparison result - Distance: ${distance}, Confidence: ${confidence}`);
      
      // If confidence is above threshold, consider it a match
      if (confidence > 0.6) {
        matches.push({
          employee: {
            id: registration.device_info.employee_id,
            name: metadata.name,
            department: metadata.department,
            position: metadata.position,
            employee_id: metadata.employee_id,
            firebase_image_url: metadata.firebase_image_url
          },
          confidence
        });
      }
    }
    
    // If we have matches, return the one with highest confidence
    if (matches.length > 0) {
      // Sort by confidence (highest first)
      matches.sort((a, b) => b.confidence - a.confidence);
      
      const bestMatch = matches[0];
      console.log('Face recognized successfully:', bestMatch.employee.name);
      
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
