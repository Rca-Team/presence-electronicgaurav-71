
import * as faceapi from 'face-api.js';

// Initialize face-api models
let modelsLoaded = false;
let isLoadingModels = false;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;
const MODEL_PATHS = [
  { net: faceapi.nets.tinyFaceDetector, name: 'TinyFaceDetector' },
  { net: faceapi.nets.faceLandmark68Net, name: 'FaceLandmark68' },
  { net: faceapi.nets.faceRecognitionNet, name: 'FaceRecognition' }
];

export async function loadModels() {
  // Return if models already loaded
  if (modelsLoaded) {
    console.log('Face recognition models already loaded');
    return;
  }
  
  // Prevent concurrent loading attempts
  if (isLoadingModels) {
    console.log('Face recognition models are currently loading, please wait...');
    
    // Wait for the current loading process to complete
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (modelsLoaded) {
          clearInterval(checkLoaded);
          resolve(true);
        } else if (!isLoadingModels && !modelsLoaded) {
          // If loading failed but is no longer in progress
          clearInterval(checkLoaded);
          reject(new Error('Model loading failed'));
        }
      }, 500);
    });
  }
  
  isLoadingModels = true;
  loadAttempts++;
  
  try {
    console.log(`Loading face recognition models from /models (attempt ${loadAttempts}/${MAX_LOAD_ATTEMPTS})...`);
    
    // Check if models directory exists by attempting to fetch a manifest file
    try {
      const testResponse = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
      if (!testResponse.ok) {
        throw new Error(`Failed to access models directory: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.error('Models directory access error:', error);
      throw new Error('Cannot access face recognition models directory. Please check if models are correctly deployed.');
    }
    
    // Load models sequentially with progress tracking
    for (const model of MODEL_PATHS) {
      console.log(`Loading ${model.name} model...`);
      await model.net.load('/models');
      console.log(`${model.name} model loaded successfully`);
    }
    
    modelsLoaded = true;
    isLoadingModels = false;
    loadAttempts = 0;
    console.log('All face recognition models loaded successfully');
    return;
  } catch (error) {
    isLoadingModels = false;
    console.error('Error loading face recognition models:', error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Model loading error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    // Retry logic
    if (loadAttempts < MAX_LOAD_ATTEMPTS) {
      console.log(`Retrying model load (attempt ${loadAttempts}/${MAX_LOAD_ATTEMPTS})...`);
      return loadModels(); // Recursive retry
    } else {
      console.error(`Failed to load models after ${MAX_LOAD_ATTEMPTS} attempts`);
      loadAttempts = 0; // Reset for future attempts
      throw new Error(`Failed to load face recognition models after ${MAX_LOAD_ATTEMPTS} attempts: ${error.message}`);
    }
  }
}

// Add a function to verify if models are loaded
export function areModelsLoaded() {
  return modelsLoaded;
}

// Helper functions for face descriptors
export function descriptorToString(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

export function stringToDescriptor(str: string): Float32Array {
  return new Float32Array(JSON.parse(str));
}

// Get face descriptor from image with improved error handling
export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> {
  try {
    if (!modelsLoaded) {
      console.log('Models not loaded, loading now...');
      await loadModels();
    }
    
    // Wait for the image/video to be fully loaded - with proper type checking
    if ((imageElement instanceof HTMLImageElement && imageElement.complete === false) || 
        (imageElement instanceof HTMLVideoElement && 
         (imageElement.readyState < 2 || imageElement.videoWidth === 0))) {
      
      console.log('Media not ready, waiting...');
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (imageElement instanceof HTMLVideoElement) {
            if (imageElement.readyState >= 2 && imageElement.videoWidth > 0) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          } else if (imageElement instanceof HTMLImageElement && imageElement.complete) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
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
    
    // If error happens due to models not loaded, try to reload them
    if (!modelsLoaded) {
      modelsLoaded = false; // Force reload
      try {
        await loadModels();
        // Try detection again after reload
        return getFaceDescriptor(imageElement);
      } catch (reloadError) {
        console.error('Error reloading models:', reloadError);
        return null;
      }
    }
    
    return null;
  }
}
