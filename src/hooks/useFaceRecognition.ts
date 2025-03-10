import { useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { 
  loadModels, 
  getFaceDescriptor,
  areModelsLoaded,
  recognizeFace,
  recordAttendance,
  storeUnrecognizedFace
} from '@/services/FaceRecognitionService';
import { toast } from 'sonner';

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
  
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setIsModelLoading(true);
        setError(null);
        console.log('Starting face recognition model initialization...');
        await loadModels();
        setIsModelLoading(false);
        console.log('Models loaded successfully');
      } catch (err) {
        console.error('Error loading face recognition models:', err);
        setError('Failed to load face recognition models. Please refresh the page.');
        setIsModelLoading(false);
        toast.error('Failed to load face recognition models. Please refresh the page.');
      }
    };
    
    console.log('Starting model initialization');
    if (!areModelsLoaded()) {
      initializeModels();
    } else {
      setIsModelLoading(false);
      console.log('Models already loaded');
    }
  }, []);
  
  const processFace = useCallback(async (mediaElement: HTMLVideoElement | HTMLImageElement): Promise<FaceRecognitionResult | null> => {
    if (isProcessing) {
      console.log('Already processing a face');
      return null;
    }
    
    if (isModelLoading) {
      console.log('Models still loading, cannot process face yet');
      setError('Face recognition models are still loading. Please wait...');
      toast.error('Face recognition models are still loading. Please wait...');
      return null;
    }
    
    try {
      console.log('Starting face processing with', mediaElement instanceof HTMLVideoElement ? 'video' : 'image');
      setIsProcessing(true);
      setError(null);
      
      console.log('Media dimensions:', 
        mediaElement instanceof HTMLVideoElement 
          ? `${mediaElement.videoWidth || 'unknown width'} x ${mediaElement.videoHeight || 'unknown height'}`
          : `${mediaElement.width || 'unknown width'} x ${mediaElement.height || 'unknown height'}`
      );
      
      // Extended check for video element readiness
      if (mediaElement instanceof HTMLVideoElement) {
        console.log('Video state:', mediaElement.readyState, 'Video dimensions:', mediaElement.videoWidth, 'x', mediaElement.videoHeight);
        
        // More robust video readiness check with multiple attempts
        let attempts = 0;
        const maxAttempts = 5;
        
        while ((mediaElement.readyState < 2 || mediaElement.videoWidth === 0) && attempts < maxAttempts) {
          console.log(`Video not ready for processing, attempt ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Longer timeout between attempts
          attempts++;
        }
        
        if (mediaElement.readyState < 2 || mediaElement.videoWidth === 0) {
          setError('Camera stream not ready. Please restart the camera and try again.');
          setIsProcessing(false);
          toast.error('Camera stream not ready. Please restart the camera and try again.');
          return null;
        }
      }
      
      const faceDescriptor = await getFaceDescriptor(mediaElement);
      
      if (!faceDescriptor) {
        console.log('No face detected');
        setError('No face detected in the image');
        setIsProcessing(false);
        toast.error('No face detected. Please try again.');
        return null;
      }
      
      console.log('Face descriptor obtained, recognizing face...');
      const recognitionResult = await recognizeFace(faceDescriptor);
      
      if (!recognitionResult.recognized) {
        console.log('Face not recognized, storing as unrecognized');
        let imageUrl;
        if (mediaElement instanceof HTMLVideoElement) {
          const canvas = document.createElement('canvas');
          canvas.width = mediaElement.videoWidth;
          canvas.height = mediaElement.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
          
          const imageData = canvas.toDataURL('image/png');
          await storeUnrecognizedFace(imageData)
            .catch(err => console.error('Failed to store unrecognized face, but continuing:', err));
          
          imageUrl = imageData;
        }
        
        const result: FaceRecognitionResult = {
          recognized: false,
          status: 'unauthorized',
          imageUrl: imageUrl
        };
        
        toast.error('Face not recognized.');
        setResult(result);
        setIsProcessing(false);
        return result;
      }
      
      const status: 'present' | 'unauthorized' = 'present';
      
      // Successfully recognized the face, record attendance
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
        timestamp,
        imageUrl: recognitionResult.employee.firebase_image_url
      };
      
      toast.success(`Welcome, ${recognitionResult.employee.name}!`);
      setResult(result);
      setIsProcessing(false);
      console.log('Face processing complete', result);
      return result;
    } catch (err) {
      console.error('Error processing face:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('Error processing face: ' + errorMessage);
      setIsProcessing(false);
      toast.error('Error processing face: ' + errorMessage);
      return null;
    }
  }, [isProcessing, isModelLoading]);
  
  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);
  
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
