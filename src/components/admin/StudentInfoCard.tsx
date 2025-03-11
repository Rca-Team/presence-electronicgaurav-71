
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaceInfo } from './utils/attendanceUtils';

interface StudentInfoCardProps {
  selectedFace: FaceInfo | null;
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
}

const StudentInfoCard: React.FC<StudentInfoCardProps> = ({ 
  selectedFace, 
  attendanceDays, 
  lateAttendanceDays 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedFace?.name || 'Student'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-muted-foreground">ID:</span>
              <p>{selectedFace?.employee_id || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Department:</span>
              <p>{selectedFace?.department || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Position:</span>
              <p>{selectedFace?.position || 'Student'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Attendance:</span>
              <p>{attendanceDays.length + lateAttendanceDays.length} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentInfoCard;
