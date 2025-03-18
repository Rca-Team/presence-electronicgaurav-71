
import React from 'react';
import { Button } from '@/components/ui/button';
import { FaceRecognitionResult } from '@/hooks/useFaceRecognition';

interface AttendanceResultProps {
  result: FaceRecognitionResult;
  resetResult: () => void;
}

const AttendanceResult: React.FC<AttendanceResultProps> = ({ result, resetResult }) => {
  return (
    <div className={`rounded-lg p-6 text-center ${
      result.status === 'unauthorized' 
        ? 'bg-destructive/10 border border-destructive/20' 
        : 'bg-secondary/50'
    }`}>
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
        result.status === 'unauthorized'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-primary/10 text-primary'
      }`}>
        {result.status === 'unauthorized' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-xl">
            <path d="M17.5 6.5c0 3-2.5 4-2.5 8"></path>
            <path d="M12 18h.01"></path>
            <circle cx="12" cy="12" r="9"></circle>
          </svg>
        ) : (
          <span className="text-xl font-semibold">{result.employee?.name.charAt(0)}</span>
        )}
      </div>
      
      <h3 className="text-xl font-bold">
        {result.status === 'unauthorized' ? 'Unknown Person' : result.employee?.name}
      </h3>
      
      <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-opacity-10 text-sm font-medium">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
          result.status === 'present' 
            ? 'bg-green-500' 
            : 'bg-destructive'
        }`}></span>
        {result.status === 'unauthorized' 
          ? 'Not Registered' 
          : `Marked as ${result.status}`}
      </div>
      
      {result.timestamp && (
        <p className="text-muted-foreground mt-1">
          {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      
      {result.status === 'unauthorized' && (
        <p className="mt-3 text-sm text-destructive">
          This person is not registered in the system.
        </p>
      )}
      
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={resetResult}>
          Take Another
        </Button>
        
        {result.status === 'unauthorized' && (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/register';
            }}
          >
            Register New Person
          </Button>
        )}
      </div>
    </div>
  );
};

export default AttendanceResult;
