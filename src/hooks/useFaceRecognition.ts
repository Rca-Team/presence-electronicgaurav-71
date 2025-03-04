
import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { loadModels, getFaceDescriptor, recognizeFace, storeUnrecognizedFace, recordAttendance } from '@/services/FaceRecognitionService';

export interface FaceRecognitionResult {
  recognized: boolean;
  employee?: any;
  status?: 'present' | 'unauthorized';  // Updated to match the database enum values
  confidence?: number;
  timestamp?: string;
}

export const useFaceRecognition = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [result, setResult] = useState<FaceRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize models on mount
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setIsModelLoading(true);
        await loadModels();
        setIsModelLoading(false);
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        setError('Failed to load face recognition models');
        setIsModelLoading(false);
      }
    };
    
    initializeModels();
  }, []);
  
  // Function to capture and process face from video or image
  const processFace = async (mediaElement: HTMLVideoElement | HTMLImageElement): Promise<FaceRecognitionResult | null> => {
    if (isProcessing || isModelLoading) return null;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Get face descriptor
      const faceDescriptor = await getFaceDescriptor(mediaElement);
      
      if (!faceDescriptor) {
        setError('No face detected in the image');
        setIsProcessing(false);
        return null;
      }
      
      // Recognize face
      const recognitionResult = await recognizeFace(faceDescriptor);
      
      if (!recognitionResult.recognized) {
        // Store unrecognized face if it's from a video element (webcam)
        if (mediaElement instanceof HTMLVideoElement) {
          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          canvas.width = mediaElement.videoWidth;
          canvas.height = mediaElement.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
          
          // Get image data as base64
          const imageData = canvas.toDataURL('image/png');
          await storeUnrecognizedFace(imageData);
        }
        
        const result = {
          recognized: false,
          status: 'unauthorized' as const
        };
        
        setResult(result);
        setIsProcessing(false);
        return result;
      }
      
      // Use 'present' status since 'late' is not a valid enum value in the database
      const status = 'present';
      
      // Record attendance
      await recordAttendance(
        recognitionResult.employee.id, 
        status, 
        recognitionResult.confidence
      );
      
      const timestamp = new Date().toISOString();
      
      const result = {
        recognized: true,
        employee: recognitionResult.employee,
        status: status,
        confidence: recognitionResult.confidence,
        timestamp
      };
      
      setResult(result);
      setIsProcessing(false);
      return result;
    } catch (err) {
      setError('Error processing face: ' + (err instanceof Error ? err.message : String(err)));
      setIsProcessing(false);
      return null;
    }
  };
  
  const resetResult = () => {
    setResult(null);
    setError(null);
  };
  
  return {
    processFace,
    isProcessing,
    isModelLoading,
    result,
    error,
    resetResult
  };
};

export default useFaceRecognition;
