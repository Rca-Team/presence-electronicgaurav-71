
import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { 
  loadModels, 
  getFaceDescriptor 
} from '@/services/face-recognition/ModelService';
import {
  recognizeFace,
  recordAttendance
} from '@/services/face-recognition/RecognitionService';
import {
  storeUnrecognizedFace
} from '@/services/face-recognition/RegistrationService';

export interface FaceRecognitionResult {
  recognized: boolean;
  employee?: any;
  status?: 'present' | 'unauthorized';  // Strictly typing this to match the database enum values
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
        console.log('Models loaded successfully');
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        setError('Failed to load face recognition models');
        setIsModelLoading(false);
      }
    };
    
    console.log('Starting model initialization');
    initializeModels();
  }, []);
  
  // Function to capture and process face from video or image
  const processFace = async (mediaElement: HTMLVideoElement | HTMLImageElement): Promise<FaceRecognitionResult | null> => {
    if (isProcessing || isModelLoading) {
      console.log('Already processing or models still loading');
      return null;
    }
    
    try {
      console.log('Starting face processing with', mediaElement instanceof HTMLVideoElement ? 'video' : 'image');
      setIsProcessing(true);
      setError(null);
      
      // Get face descriptor
      console.log('Getting face descriptor...');
      const faceDescriptor = await getFaceDescriptor(mediaElement);
      
      if (!faceDescriptor) {
        console.log('No face detected');
        setError('No face detected in the image');
        setIsProcessing(false);
        return null;
      }
      
      console.log('Face descriptor obtained, recognizing face...');
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
        
        const result: FaceRecognitionResult = {
          recognized: false,
          status: 'unauthorized'
        };
        
        setResult(result);
        setIsProcessing(false);
        return result;
      }
      
      // Use 'present' status for recognized faces
      const status: 'present' | 'unauthorized' = 'present';
      
      // Record attendance
      await recordAttendance(
        recognitionResult.employee.id, 
        status, 
        recognitionResult.confidence
      );
      
      const timestamp = new Date().toISOString();
      
      const result: FaceRecognitionResult = {
        recognized: true,
        employee: recognitionResult.employee,
        status: status,
        confidence: recognitionResult.confidence,
        timestamp
      };
      
      setResult(result);
      setIsProcessing(false);
      console.log('Face processing complete', result);
      return result;
    } catch (err) {
      console.error('Error processing face:', err);
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
