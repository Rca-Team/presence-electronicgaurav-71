
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';

// Initialize face-api models
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
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
    const detections = await faceapi.detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      console.log('No face detected');
      return null;
    }
    
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
    // First check if employee exists
    let { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
      
    let employeeUuid: string;
    
    if (empError || !employee) {
      // Employee doesn't exist, create new employee
      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert(employeeData)
        .select('id')
        .single();
        
      if (createError || !newEmployee) {
        console.error('Error creating employee:', createError);
        return false;
      }
      
      employeeUuid = newEmployee.id;
    } else {
      employeeUuid = employee.id;
      
      // Update existing employee
      const { error: updateError } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', employeeUuid);
        
      if (updateError) {
        console.error('Error updating employee:', updateError);
        return false;
      }
    }
    
    // Store face encoding
    const { error: encodingError } = await supabase
      .from('face_encodings')
      .insert({
        employee_id: employeeUuid,
        encoding: descriptorToString(faceDescriptor)
      });
      
    if (encodingError) {
      console.error('Error storing face encoding:', encodingError);
      return false;
    }
    
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
    // Get all face encodings from the database
    const { data: encodings, error: encodingsError } = await supabase
      .from('face_encodings')
      .select('encoding, employee_id');
      
    if (encodingsError || !encodings || encodings.length === 0) {
      console.error('Error fetching face encodings:', encodingsError);
      return { recognized: false };
    }
    
    // Convert encodings to face descriptors
    const faceMatchers = encodings.map(entry => {
      const descriptor = stringToDescriptor(entry.encoding);
      return {
        descriptor,
        employeeId: entry.employee_id,
        distance: faceapi.euclideanDistance(descriptor, faceDescriptor)
      };
    });
    
    // Find the best match
    faceMatchers.sort((a, b) => a.distance - b.distance);
    const bestMatch = faceMatchers[0];
    
    // If distance is below threshold, consider it a match (lower is better)
    // Typical threshold is 0.5-0.6
    const MATCH_THRESHOLD = 0.6;
    
    if (bestMatch.distance <= MATCH_THRESHOLD) {
      // Get employee details
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', bestMatch.employeeId)
        .single();
        
      if (employeeError || !employee) {
        console.error('Error fetching employee details:', employeeError);
        return { recognized: false };
      }
      
      // Calculate confidence score (convert distance to a 0-100 scale)
      const confidence = Math.max(0, Math.min(100, (1 - bestMatch.distance / MATCH_THRESHOLD) * 100));
      
      return { 
        recognized: true, 
        employee,
        confidence
      };
    }
    
    return { recognized: false };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return { recognized: false };
  }
}

// Record attendance
export async function recordAttendance(employeeId: string, status: string = 'present', confidence: number = 100): Promise<boolean> {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Record attendance
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        employee_id: employeeId,
        status,
        confidence_score: confidence,
        device_info: deviceInfo
      });
      
    if (attendanceError) {
      console.error('Error recording attendance:', attendanceError);
      return false;
    }
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have an attendance record for today
    const { data: existingDate, error: dateCheckError } = await supabase
      .from('attendance_dates')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('date', today);
      
    if (dateCheckError) {
      console.error('Error checking attendance date:', dateCheckError);
      return false;
    }
    
    // If no record for today, add one
    if (!existingDate || existingDate.length === 0) {
      const { error: dateError } = await supabase
        .from('attendance_dates')
        .insert({
          employee_id: employeeId,
          date: today
        });
        
      if (dateError) {
        console.error('Error recording attendance date:', dateError);
        return false;
      }
      
      // Update total attendance count
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          total_attendance: supabase.rpc('increment', { x: 1 }),
          last_attendance_time: new Date().toISOString()
        })
        .eq('id', employeeId);
        
      if (updateError) {
        console.error('Error updating attendance count:', updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error recording attendance:', error);
    return false;
  }
}

// Store unrecognized face
export async function storeUnrecognizedFace(imageData: string): Promise<boolean> {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('unrecognized_faces')
      .insert({
        image_data: imageData,
        device_info: deviceInfo
      });
      
    if (error) {
      console.error('Error storing unrecognized face:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error storing unrecognized face:', error);
    return false;
  }
}
