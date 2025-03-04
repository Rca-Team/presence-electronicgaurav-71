
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';

// Initialize face-api models
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    console.log('Loading face recognition models from /models...');
    
    // Force use of specific model versions to prevent shape mismatch errors
    await faceapi.nets.ssdMobilenetv1.load('/models');
    console.log('SSD Mobilenet model loaded successfully');
    
    await faceapi.nets.faceLandmark68Net.load('/models');
    console.log('Face landmark model loaded successfully');
    
    await faceapi.nets.faceRecognitionNet.load('/models');
    console.log('Face recognition model loaded successfully');
    
    modelsLoaded = true;
    console.log('All face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Model loading error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Convert face descriptor to string for storage
export function descriptorToString(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

// Convert string back to face descriptor
export function stringToDescriptor(str: string): Float32Array {
  return new Float32Array(JSON.parse(str));
}

// Get face descriptor from image
export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> {
  try {
    if (!modelsLoaded) {
      console.log('Models not loaded, loading now...');
      await loadModels();
    }
    
    console.log('Detecting face in image...');
    const detections = await faceapi.detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      console.log('No face detected in the image');
      return null;
    }
    
    console.log('Face detected successfully');
    return detections.descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
}

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
