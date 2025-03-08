
import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, X } from 'lucide-react';

interface DailyAttendanceDetailsProps {
  selectedDate: Date | undefined;
  dailyAttendance: {
    id: string;
    timestamp: string;
    status: string;
  }[];
  isDateInArray: (date: Date, dateArray: Date[]) => boolean;
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
  absentDays: Date[];
}

const DailyAttendanceDetails: React.FC<DailyAttendanceDetailsProps> = ({
  selectedDate,
  dailyAttendance,
  isDateInArray,
  attendanceDays,
  lateAttendanceDays,
  absentDays
}) => {
  // Format time to 12-hour format with AM/PM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Format date to show day of week and date
  const formatDateWithDay = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  if (!selectedDate) return null;

  // Debug logs to help identify issues
  console.log("Selected date:", selectedDate);
  console.log("Daily attendance:", dailyAttendance);
  console.log("Is date in attendanceDays:", isDateInArray(selectedDate, attendanceDays));
  console.log("Is date in lateAttendanceDays:", isDateInArray(selectedDate, lateAttendanceDays));
  console.log("Is date in absentDays:", isDateInArray(selectedDate, absentDays));
  console.log("Attendance days count:", attendanceDays.length);
  console.log("Late attendance days count:", lateAttendanceDays.length);
  console.log("Absent days count:", absentDays.length);

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-medium mb-2">
        {formatDateWithDay(selectedDate)}
      </h3>
      {dailyAttendance.length > 0 ? (
        <div className="space-y-2">
          {dailyAttendance.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center">
                {record.status === 'late' ? (
                  <Clock className="h-4 w-4 text-amber-500 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                )}
                <span>
                  {formatTime(record.timestamp)}
                </span>
              </div>
              <Badge variant={record.status === 'late' ? "outline" : "default"}>
                {record.status === 'late' ? 'Late' : 'Present'}
              </Badge>
            </div>
          ))}
        </div>
      ) : isDateInArray(selectedDate, attendanceDays) ? (
        <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
          <UserCheck className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-500 font-medium">Present</span>
        </div>
      ) : isDateInArray(selectedDate, lateAttendanceDays) ? (
        <div className="flex items-center justify-center p-4 bg-amber-50 rounded-md">
          <Clock className="h-5 w-5 text-amber-500 mr-2" />
          <span className="text-amber-500 font-medium">Late</span>
        </div>
      ) : isDateInArray(selectedDate, absentDays) ? (
        <div className="flex items-center justify-center p-4 bg-red-50 rounded-md">
          <X className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-500 font-medium">Absent</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No attendance recorded for this date.</p>
      )}
    </div>
  );
};

export default DailyAttendanceDetails;
