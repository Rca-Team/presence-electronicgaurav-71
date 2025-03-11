
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Clock, UserCheck, BookOpen, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FaceInfo } from './utils/attendanceUtils';
import DailyAttendanceDetails from './DailyAttendanceDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParentContactInfo from './ParentContactInfo';

interface InfoItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon: Icon }) => (
  <div className="flex items-center">
    <div className="bg-primary/10 p-2 rounded-full mr-3">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

interface StudentInfoCardProps {
  selectedFace: FaceInfo | null;
  dailyAttendance: {
    id: string;
    timestamp: string;
    status: string;
  }[];
  selectedDate?: Date;
}

const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  selectedFace,
  dailyAttendance,
  selectedDate,
}) => {
  if (!selectedFace) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
          <User className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium">No Student Selected</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Select a student from the list to view their information and attendance details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Student Information</CardTitle>
          <Badge variant="outline">{selectedFace.id || 'N/A'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Information</TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1">Parent Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <div className="space-y-6">
              <div className="flex flex-col items-center mt-2 pb-4">
                {selectedFace.photo ? (
                  <img
                    src={selectedFace.photo}
                    alt={selectedFace.name}
                    className="h-24 w-24 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedFace.name}&background=random`;
                    }}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <h3 className="mt-3 text-xl font-bold">{selectedFace.name}</h3>
                <p className="text-muted-foreground">{selectedFace.position || 'Student'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="ID" value={selectedFace.employeeId || selectedFace.employee_id} icon={User} />
                <InfoItem label="Department" value={selectedFace.department} icon={BookOpen} />
                <InfoItem
                  label="Registration Date"
                  value={selectedFace.registrationDate || 'Not available'}
                  icon={Calendar}
                />
                <InfoItem
                  label="Last Attendance"
                  value={selectedFace.lastAttendance || 'Never'}
                  icon={Clock}
                />
                <InfoItem
                  label="Total Attendance"
                  value={`${selectedFace.totalAttendance || 0} days`}
                  icon={UserCheck}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="attendance">
            {selectedDate && (
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">
                  Attendance on {selectedDate.toLocaleDateString()}
                </h3>
                <DailyAttendanceDetails 
                  dailyAttendance={dailyAttendance}
                  selectedDate={selectedDate}
                  isDateInArray={() => false} // Placeholder function
                  attendanceDays={[]} // Placeholder empty array
                  lateAttendanceDays={[]} // Placeholder empty array
                  absentDays={[]} // Placeholder empty array 
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="contact">
            <div className="pt-2">
              <ParentContactInfo studentId={selectedFace.userId || selectedFace.id} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
};

export default StudentInfoCard;
