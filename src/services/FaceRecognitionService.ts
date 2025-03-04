
// Re-export all functions from our modular services
export { 
  loadModels, 
  getFaceDescriptor,
  descriptorToString,
  stringToDescriptor
} from './face-recognition/ModelService';

export {
  registerFace,
  storeUnrecognizedFace
} from './face-recognition/RegistrationService';

export {
  recognizeFace,
  recordAttendance
} from './face-recognition/RecognitionService';
