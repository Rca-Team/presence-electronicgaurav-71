
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttendanceCalendar } from './hooks/useAttendanceCalendar';
import StudentInfoCard from './StudentInfoCard';
import DailyAttendanceDetails from './DailyAttendanceDetails';
import AttendanceCalendarView from './AttendanceCalendarView';
import ReportControls from './ReportControls';

interface AttendanceCalendarProps {
  selectedFaceId: string | null;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedFaceId }) => {
  const {
    attendanceDays,
    lateAttendanceDays,
    absentDays,
    selectedFace,
    selectedDate,
    setSelectedDate,
    dailyAttendance,
    workingDays,
    isDateInArray
  } = useAttendanceCalendar(selectedFaceId);

  return (
    <div className="space-y-6">
      {selectedFaceId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Attendance Calendar</CardTitle>
                <ReportControls
                  selectedFace={selectedFace}
                  workingDays={workingDays}
                  attendanceDays={attendanceDays}
                  lateAttendanceDays={lateAttendanceDays}
                  absentDays={absentDays}
                  selectedDate={selectedDate}
                  dailyAttendance={dailyAttendance}
                />
              </CardHeader>
              <CardContent>
                <AttendanceCalendarView
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  attendanceDays={attendanceDays}
                  lateAttendanceDays={lateAttendanceDays}
                  absentDays={absentDays}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedFace?.name || 'Student'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StudentInfoCard 
                    selectedFace={selectedFace} 
                    attendanceDays={attendanceDays} 
                    lateAttendanceDays={lateAttendanceDays} 
                  />
                  
                  {selectedDate && (
                    <DailyAttendanceDetails
                      selectedDate={selectedDate}
                      dailyAttendance={dailyAttendance}
                      isDateInArray={isDateInArray}
                      attendanceDays={attendanceDays}
                      lateAttendanceDays={lateAttendanceDays}
                      absentDays={absentDays}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
              <h3 className="text-lg font-medium mb-2">No student selected</h3>
              <p className="text-muted-foreground">
                Select a student from the list to view their attendance calendar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceCalendar;
