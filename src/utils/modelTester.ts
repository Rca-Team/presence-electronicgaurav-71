
import { loadModels, areModelsLoaded } from '@/services/FaceRecognitionService';

/**
 * Utility function to test model loading
 */
export async function testModelLoading(): Promise<void> {
  console.log('Starting model loading test...');
  
  try {
    // Check if models are already loaded
    if (areModelsLoaded()) {
      console.log('Models are already loaded. Skipping load test.');
      return;
    }
    
    // Try to load models
    console.log('Attempting to load face recognition models...');
    await loadModels();
    console.log('Model loading test completed successfully.');
  } catch (error) {
    console.error('Model loading test failed:', error);
    throw error;
  }
}

/**
 * Call this function from a component's useEffect or a button handler
 * to manually test model loading
 */
export function runModelTest(): void {
  testModelLoading()
    .then(() => console.log('Model test finished successfully'))
    .catch(err => console.error('Model test failed with error:', err));
}
