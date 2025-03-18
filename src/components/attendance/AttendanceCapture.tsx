
import React, { useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Webcam } from '@/components/ui/webcam';
import { Button } from '@/components/ui/button';
import useFaceRecognition from '@/hooks/useFaceRecognition';
import AttendanceResult from './AttendanceResult';

const AttendanceCapture = () => {
  const { toast } = useToast();
  const webcamRef = useRef<HTMLVideoElement>(null);
  
  const {
    processFace,
    isProcessing,
    isModelLoading,
    result,
    error,
    resetResult
  } = useFaceRecognition();
  
  const handleCapture = async () => {
    if (!webcamRef.current || isProcessing || isModelLoading) {
      console.log('Cannot capture: webcam not ready, processing in progress, or models still loading');
      console.log('Webcam ref exists:', !!webcamRef.current);
      console.log('Is processing:', isProcessing);
      console.log('Is model loading:', isModelLoading);
      return;
    }
    
    try {
      console.log('Processing face recognition...');
      console.log('Webcam video element:', webcamRef.current);
      console.log('Video element ready state:', webcamRef.current.readyState);
      console.log('Video dimensions:', webcamRef.current.videoWidth, 'x', webcamRef.current.videoHeight);
      
      const recognitionResult = await processFace(webcamRef.current);
      
      if (!recognitionResult) {
        toast({
          title: "Processing Error",
          description: error || "Failed to process face. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const displayStatus = recognitionResult.status === 'present' ? 'present' : 'unauthorized';
      const statusMessage = displayStatus === 'present' ? 'present' : 'not authorized';
      
      if (recognitionResult.recognized) {
        toast({
          title: "Attendance Recorded",
          description: `${recognitionResult.employee.name} marked as ${statusMessage} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          variant: displayStatus === 'present' ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Recognition Failed",
          description: "This person is not registered in the system.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Face recognition error:', err);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the image.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Facial Recognition</h3>
      <div className="space-y-4">
        <Webcam
          ref={webcamRef}
          onCapture={() => handleCapture()}
          className="w-full"
          showControls={!isProcessing && !result}
          autoStart={!result}
        />
        
        {isModelLoading && (
          <div className="flex flex-col items-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-muted-foreground">Loading face recognition models...</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex flex-col items-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-muted-foreground">Processing face recognition...</p>
          </div>
        )}
        
        {result && <AttendanceResult result={result} resetResult={resetResult} />}
      </div>
    </Card>
  );
};

export default AttendanceCapture;
