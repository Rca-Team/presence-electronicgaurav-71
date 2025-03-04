
import * as faceapi from 'face-api.js';

// Initialize face-api models
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    console.log('Loading face recognition models from /models...');
    
    // Use TinyFaceDetector for faster performance
    await faceapi.nets.tinyFaceDetector.load('/models');
    console.log('TinyFaceDetector model loaded successfully');
    
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

// Helper functions for face descriptors
export function descriptorToString(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

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
    // Use TinyFaceDetector with proper options and detectionMethod
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 416, 
      scoreThreshold: 0.5 
    });
    
    const detections = await faceapi.detectSingleFace(imageElement, detectionOptions)
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
