
import { supabase } from '@/integrations/supabase/client';
import * as faceapi from 'face-api.js';
import { stringToDescriptor } from './ModelService';

// Recognize a face from the database
export async function recognizeFace(faceDescriptor: Float32Array): Promise<{ 
  recognized: boolean; 
  employee?: any;
  confidence?: number; 
}> {
  try {
    console.log('Attempting to recognize face...');
    // Get all face encodings from the database
    const { data: encodings, error: encodingsError } = await supabase
      .from('face_profiles')
      .select('face_data, user_id');
      
    if (encodingsError || !encodings || encodings.length === 0) {
      console.error('Error fetching face data:', encodingsError);
      return { recognized: false };
    }
    
    console.log(`Retrieved ${encodings.length} face profiles for comparison`);
    
    // Convert encodings to face descriptors
    const faceMatchers = encodings.map(entry => {
      const descriptor = stringToDescriptor(entry.face_data);
      return {
        descriptor,
        userId: entry.user_id,
        distance: faceapi.euclideanDistance(descriptor, faceDescriptor)
      };
    });
    
    // Find the best match
    faceMatchers.sort((a, b) => a.distance - b.distance);
    const bestMatch = faceMatchers[0];
    
    // If distance is below threshold, consider it a match (lower is better)
    // Typical threshold is 0.5-0.6
    const MATCH_THRESHOLD = 0.6;
    console.log(`Best match distance: ${bestMatch.distance}, threshold: ${MATCH_THRESHOLD}`);
    
    if (bestMatch.distance <= MATCH_THRESHOLD) {
      console.log('Match found! Retrieving profile details...');
      // Get profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bestMatch.userId)
        .maybeSingle();
        
      if (profileError || !profile) {
        console.error('Error fetching profile details:', profileError);
        return { recognized: false };
      }
      
      // Calculate confidence score (convert distance to a 0-100 scale)
      const confidence = Math.max(0, Math.min(100, (1 - bestMatch.distance / MATCH_THRESHOLD) * 100));
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
