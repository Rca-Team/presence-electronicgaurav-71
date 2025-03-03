
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WebcamProps {
  onCapture?: (image: string) => void;
  className?: string;
  overlayClassName?: string;
  cameraFacing?: 'user' | 'environment';
  showControls?: boolean;
  aspectRatio?: 'square' | 'video';
  autoStart?: boolean;
}

export function Webcam({
  onCapture,
  className,
  overlayClassName,
  cameraFacing = 'user',
  showControls = true,
  aspectRatio = 'video',
  autoStart = true,
}: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(autoStart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Camera access denied or not available');
        setIsLoading(false);
        setIsActive(false);
        console.error('Error accessing camera:', err);
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, cameraFacing]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame on the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');
      
      // Call the onCapture callback with the image data
      if (onCapture) {
        onCapture(imageData);
      }
    }
  };

  const toggleCamera = () => {
    setIsActive(prev => !prev);
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-muted rounded-xl",
      aspectRatio === 'square' ? "aspect-square" : "aspect-video",
      className
    )}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-10 w-10 text-destructive mb-3"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p className="text-destructive font-medium mb-2">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleCamera}
          >
            Try Again
          </Button>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isActive && !isLoading && !error ? "opacity-100" : "opacity-0"
        )}
      />
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className={cn(
        "absolute inset-0 border-4 border-transparent rounded-xl transition-all duration-300",
        overlayClassName
      )} />
      
      {showControls && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {isActive ? (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={handleCapture}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 backdrop-blur-sm hover:bg-white text-destructive"
                onClick={toggleCamera}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              onClick={toggleCamera}
              className="bg-white/80 backdrop-blur-sm text-primary hover:bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 mr-2"
              >
                <path d="M23 7 16 12 23 17z" />
                <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
              </svg>
              Start Camera
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
