
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';

// Initialize face-api models
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    console.log('Loading face recognition models from /models...');
    
    // Load models one by one with explicit progress logging
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    console.log('SSD Mobilenet model loaded');
    
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    console.log('Face landmark model loaded');
    
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    console.log('Face recognition model loaded');
    
    modelsLoaded = true;
    console.log('All face recognition models loaded successfully');
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
    // First check if employee exists
    let { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
      
    let employeeUuid: string;
    
    if (empError || !employee) {
      console.log('Employee not found, creating new employee record');
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
      console.log('New employee created with ID:', employeeUuid);
    } else {
      employeeUuid = employee.id;
      console.log('Existing employee found with ID:', employeeUuid);
      
      // Update existing employee
      const { error: updateError } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', employeeUuid);
        
      if (updateError) {
        console.error('Error updating employee:', updateError);
        return false;
      }
      console.log('Employee data updated successfully');
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
    
    console.log('Face encoding stored successfully');
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
      .from('face_encodings')
      .select('encoding, employee_id');
      
    if (encodingsError || !encodings || encodings.length === 0) {
      console.error('Error fetching face encodings:', encodingsError);
      return { recognized: false };
    }
    
    console.log(`Retrieved ${encodings.length} face encodings for comparison`);
    
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
    console.log(`Best match distance: ${bestMatch.distance}, threshold: ${MATCH_THRESHOLD}`);
    
    if (bestMatch.distance <= MATCH_THRESHOLD) {
      console.log('Match found! Retrieving employee details...');
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
      console.log(`Employee recognized: ${employee.name} with ${confidence.toFixed(2)}% confidence`);
      
      return { 
        recognized: true, 
        employee,
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
export async function recordAttendance(employeeId: string, status: string = 'present', confidence: number = 100): Promise<boolean> {
  try {
    console.log('Recording attendance for employee ID:', employeeId);
    
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
      console.log('First attendance today, adding date record');
      
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
      
      // For updating total_attendance, we'll use a direct +1 instead of RPC
      const { data: employeeData, error: getEmployeeError } = await supabase
        .from('employees')
        .select('total_attendance')
        .eq('id', employeeId)
        .single();
        
      if (getEmployeeError) {
        console.error('Error getting employee data:', getEmployeeError);
        return false;
      }
      
      const currentCount = employeeData?.total_attendance || 0;
      
      // Update total attendance count
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          total_attendance: currentCount + 1,
          last_attendance_time: new Date().toISOString()
        })
        .eq('id', employeeId);
        
      if (updateError) {
        console.error('Error updating attendance count:', updateError);
        return false;
      }
    }
    
    console.log('Attendance recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording attendance:', error);
    return false;
  }
}

// Store unrecognized face
export async function storeUnrecognizedFace(imageData: string): Promise<boolean> {
  try {
    console.log('Storing unrecognized face');
    
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
    
    console.log('Unrecognized face stored successfully');
    return true;
  } catch (error) {
    console.error('Error storing unrecognized face:', error);
    return false;
  }
}
