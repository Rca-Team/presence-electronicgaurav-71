
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add error handling for network issues
const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  const root = createRoot(rootElement);
  
  // Global error handler for network issues
  window.addEventListener('error', (event) => {
    if (event.message.includes('network') || event.message.includes('failed to fetch')) {
      console.error('Network error detected:', event);
    }
  });
  
  root.render(<App />);
};

// Initialize the app
renderApp();
