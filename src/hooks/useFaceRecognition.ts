
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
  imageUrl?: string;  // Add imageUrl field to store Firebase URL
}

export const useFaceRecognition = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [result, setResult] = useState<FaceRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    const initializeModels = async () => {
      if (modelsLoaded) return;
      
      try {
        setIsModelLoading(true);
        console.log('Starting to load face recognition models...');
        await loadModels();
        setIsModelLoading(false);
        setModelsLoaded(true);
        console.log('Models loaded successfully');
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        setError('Failed to load face recognition models: ' + (err instanceof Error ? err.message : String(err)));
        setIsModelLoading(false);
        
        // Retry loading after 3 seconds in case of network issues
        setTimeout(() => {
          if (!modelsLoaded) {
            console.log('Retrying model loading...');
            setModelsLoaded(false);
          }
        }, 3000);
      }
    };
    
    console.log('Starting model initialization');
    initializeModels();
  }, [modelsLoaded]);
  
  const processFace = async (mediaElement: HTMLVideoElement | HTMLImageElement): Promise<FaceRecognitionResult | null> => {
    if (isProcessing || isModelLoading) {
      console.log('Already processing or models still loading');
      return null;
    }
    
    try {
      console.log('Starting face processing with', mediaElement instanceof HTMLVideoElement ? 'video' : 'image');
      setIsProcessing(true);
      setError(null);
      
      console.log('Media dimensions:', mediaElement.width || 'unknown width', 'x', mediaElement.height || 'unknown height');
      
      if (mediaElement instanceof HTMLVideoElement) {
        console.log('Video state:', mediaElement.readyState, 'Video dimensions:', mediaElement.videoWidth, 'x', mediaElement.videoHeight);
        
        if (mediaElement.readyState < 2 || mediaElement.videoWidth === 0) {
          console.log('Video not ready for processing, retrying...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (mediaElement.readyState < 2 || mediaElement.videoWidth === 0) {
            setError('Video stream not ready. Please try again.');
            setIsProcessing(false);
            return null;
          }
        }
      }
      
      const faceDescriptor = await getFaceDescriptor(mediaElement);
      
      if (!faceDescriptor) {
        console.log('No face detected');
        setError('No face detected in the image');
        setIsProcessing(false);
        return null;
      }
      
      console.log('Face descriptor obtained, recognizing face...');
      const recognitionResult = await recognizeFace(faceDescriptor);
      
      if (!recognitionResult.recognized) {
        console.log('Face not recognized, storing as unrecognized');
        let imageUrl;
        try {
          if (mediaElement instanceof HTMLVideoElement) {
            const canvas = document.createElement('canvas');
            canvas.width = mediaElement.videoWidth;
            canvas.height = mediaElement.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }
            ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.toDataURL('image/png');
            try {
              await storeUnrecognizedFace(imageData);
            } catch (err) {
              console.error('Failed to store unrecognized face, but continuing:', err);
            }
            
            imageUrl = imageData;
          }
        } catch (storageError) {
          console.error('Error storing unrecognized face, continuing with recognition flow:', storageError);
        }
        
        const result: FaceRecognitionResult = {
          recognized: false,
          status: 'unauthorized',
          imageUrl: imageUrl,
          timestamp: new Date().toISOString()
        };
        
        setResult(result);
        setIsProcessing(false);
        return result;
      }
      
      const status: 'present' | 'unauthorized' = 'present';
      
      try {
        // Successfully recognized the face, record attendance
        await recordAttendance(
          recognitionResult.employee.id, 
          status, 
          recognitionResult.confidence
        );
      } catch (attendanceError) {
        console.error('Error recording attendance, but continuing with recognition result:', attendanceError);
      }
      
      const timestamp = new Date().toISOString();
      
      const result: FaceRecognitionResult = {
        recognized: true,
        employee: recognitionResult.employee,
        status: status,
        confidence: recognitionResult.confidence,
        timestamp,
        imageUrl: recognitionResult.employee.firebase_image_url
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
