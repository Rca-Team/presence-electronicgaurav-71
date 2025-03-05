
import { supabase } from '@/integrations/supabase/client';
import * as faceapi from 'face-api.js';
import { stringToDescriptor } from './ModelService';

// Recognize a face from the database using FaceMatcher
export async function recognizeFace(faceDescriptor: Float32Array): Promise<{ 
  recognized: boolean; 
  employee?: any;
  confidence?: number; 
}> {
  try {
    console.log('Attempting to recognize face with FaceMatcher...');
    // Get all face encodings from the database
    const { data: encodings, error: encodingsError } = await supabase
      .from('face_profiles')
      .select('face_data, user_id');
      
    if (encodingsError || !encodings || encodings.length === 0) {
      console.error('Error fetching face data:', encodingsError);
      return { recognized: false };
    }
    
    console.log(`Retrieved ${encodings.length} face profiles for comparison`);
    
    // Convert encodings to face descriptors and create labeled face descriptors
    const labeledFaceDescriptors = encodings
      .filter(entry => entry.user_id) // Filter out null user_ids
      .map(entry => {
        const descriptor = stringToDescriptor(entry.face_data);
        // Create a labeled face descriptor for the FaceMatcher
        return new faceapi.LabeledFaceDescriptors(
          entry.user_id, 
          [descriptor] // Array of descriptors (just one in this case)
        );
      });
    
    if (labeledFaceDescriptors.length === 0) {
      console.log('No valid face profiles found in database');
      return { recognized: false };
    }
    
    // Create a FaceMatcher with labeled descriptors
    // Using a lower distance threshold for better accuracy (0.5 is default)
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
    
    // Find best match for the face descriptor
    const bestMatch = faceMatcher.findBestMatch(faceDescriptor);
    
    console.log(`Best match: ${bestMatch.label} with distance: ${bestMatch.distance}`);
    
    // If the best match is not 'unknown', we have a match
    if (bestMatch.label !== 'unknown') {
      // Get profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bestMatch.label)
        .maybeSingle();
        
      if (profileError || !profile) {
        console.error('Error fetching profile details:', profileError);
        return { recognized: false };
      }
      
      // Calculate confidence score (convert distance to a 0-100 scale)
      // Lower distance means higher confidence
      const confidence = Math.max(0, Math.min(100, (1 - bestMatch.distance) * 100));
      console.log(`User recognized: ${profile.username} with ${confidence.toFixed(2)}% confidence`);
      
      return { 
        recognized: true, 
        employee: {
          id: profile.id,
          name: profile.username,
          avatar_url: profile.avatar_url
        },
        confidence
      };
    }
    
    console.log('No match found for the face');
    return { recognized: false };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return { recognized: false };
  }
}

// Record attendance
export async function recordAttendance(
  userId: string, 
  status: 'present' | 'unauthorized' = 'present', 
  confidence: number = 100
): Promise<boolean> {
  try {
    console.log('Recording attendance for user ID:', userId);
    
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Record attendance
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        user_id: userId,
        status: status,
        confidence_score: confidence,
        device_info: deviceInfo
      });
      
    if (attendanceError) {
      console.error('Error recording attendance:', attendanceError);
      return false;
    }
    
    console.log('Attendance recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording attendance:', error);
    return false;
  }
}
