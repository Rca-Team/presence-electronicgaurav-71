
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { loadModels } from './services/FaceRecognitionService'
import { toast } from 'sonner'

// Attempt to load models early
loadModels()
  .then(() => console.log('Face recognition models loaded successfully'))
  .catch(err => {
    console.error('Error pre-loading face models:', err)
    // We'll continue rendering the app, but show a toast message
    setTimeout(() => {
      toast.error('Failed to pre-load face recognition models. Some features may not work correctly.')
    }, 1000)
  })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
