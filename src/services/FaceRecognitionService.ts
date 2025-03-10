
// Re-export all functions from our modular services
export { 
  loadModels, 
  getFaceDescriptor,
  descriptorToString,
  stringToDescriptor,
  areModelsLoaded,
  forceReloadModels
} from './face-recognition/ModelService';

export {
  registerFace,
  storeUnrecognizedFace,
  uploadFaceImage
} from './face-recognition/RegistrationService';

export {
  recognizeFace,
  recordAttendance
} from './face-recognition/RecognitionService';
