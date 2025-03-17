
import { format } from 'date-fns';
import { FaceInfo, isDateInArray } from './attendanceUtils';

interface ReportGenerationProps {
  selectedFace: FaceInfo;
  workingDays: Date[];
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
  absentDays: Date[];
  selectedDate?: Date;
  dailyAttendance: {
    id: string;
    timestamp: string;
    status: string;
  }[];
}

// Generate and open a printable report
export const generatePrintableReport = ({
  selectedFace,
  workingDays,
  attendanceDays,
  lateAttendanceDays,
  absentDays,
  selectedDate,
  dailyAttendance
}: ReportGenerationProps): Window | null => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get today's actual date for reference
  const today = new Date();
  
  // Get date 30 days ago from today
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Filter to include only the last 30 days from today
  const filteredWorkDays = workingDays.filter(date => {
    return date <= today && date >= thirtyDaysAgo;
  });
  
  // Calculate stats for the filtered days
  const totalWorkDays = filteredWorkDays.length;
  
  // Count present, late, and absent days within the date range
  const presentCount = attendanceDays.filter(date => date >= thirtyDaysAgo && date <= today).length;
  const lateCount = lateAttendanceDays.filter(date => date >= thirtyDaysAgo && date <= today).length;
  const absentCount = absentDays.filter(date => date >= thirtyDaysAgo && date <= today).length;
  
  const attendanceRate = totalWorkDays > 0 ? ((presentCount + lateCount) / totalWorkDays * 100).toFixed(1) : "0.0";

  // Create rows for attendance table - using the last 30 days
  const tableRows = filteredWorkDays
    .sort((a, b) => b.getTime() - a.getTime())
    .map(date => {
      const isPresent = isDateInArray(date, attendanceDays);
      const isLate = isDateInArray(date, lateAttendanceDays);
      const isAbsent = isDateInArray(date, absentDays);
      
      let attendanceTime = '';
      if ((isPresent || isLate) && 
          selectedDate &&
          date.getDate() === selectedDate.getDate() && 
          date.getMonth() === selectedDate.getMonth() && 
          date.getFullYear() === selectedDate.getFullYear() && 
          dailyAttendance.length > 0) {
        const firstRecord = dailyAttendance[0];
        const recordTime = new Date(firstRecord.timestamp);
        attendanceTime = recordTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      let status = 'N/A';
      let statusClass = '';
      
      if (isPresent) {
        status = 'Present';
        statusClass = 'status-present';
      } else if (isLate) {
        status = 'Late';
        statusClass = 'status-late';
      } else if (isAbsent) {
        status = 'Absent';
        statusClass = 'status-absent';
      }
      
      return `
        <tr>
          <td>${formatDate(date)}</td>
          <td><span class="status-badge ${statusClass}">${status}</span></td>
          <td>${(isPresent || isLate) ? attendanceTime || 'N/A' : '-'}</td>
        </tr>
      `;
    }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Attendance Report - ${selectedFace.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2563eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            color: #666;
          }
          .summary {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            margin-left: 5px;
          }
          .status-present {
            background-color: #10b981;
          }
          .status-late {
            background-color: #f59e0b;
          }
          .status-absent {
            background-color: #ef4444;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
          }
          @media print {
            body {
              font-size: 12pt;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Attendance Report</h1>
          <p>Generated on ${formatDate(today)}</p>
          <p>Showing last 30 days: ${formatDate(thirtyDaysAgo)} - ${formatDate(today)}</p>
        </div>
        
        <h2>Student Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Name:</div>
            <div>${selectedFace.name}</div>
          </div>
          <div class="info-item">
            <div class="label">ID:</div>
            <div>${selectedFace.employee_id}</div>
          </div>
          <div class="info-item">
            <div class="label">Department:</div>
            <div>${selectedFace.department}</div>
          </div>
          <div class="info-item">
            <div class="label">Position:</div>
            <div>${selectedFace.position}</div>
          </div>
        </div>
        
        <h2>Attendance Summary (Last 30 Days)</h2>
        <div class="summary">
          <div class="info-item">
            <div class="label">Total Working Days:</div>
            <div>${totalWorkDays}</div>
          </div>
          <div class="info-item">
            <div class="label">Present Days:</div>
            <div>${presentCount} <span class="status-badge status-present">Present</span></div>
          </div>
          <div class="info-item">
            <div class="label">Late Days:</div>
            <div>${lateCount} <span class="status-badge status-late">Late</span></div>
          </div>
          <div class="info-item">
            <div class="label">Absent Days:</div>
            <div>${absentCount} <span class="status-badge status-absent">Absent</span></div>
          </div>
          <div class="info-item">
            <div class="label">Attendance Rate:</div>
            <div>${attendanceRate}%</div>
          </div>
        </div>
        
        <h2>Attendance Details (Last 30 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Time (if present)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()">Print Report</button>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  return printWindow;
};

// Generate and download CSV file
export const exportToCSV = ({
  selectedFace,
  workingDays,
  attendanceDays,
  lateAttendanceDays,
  absentDays,
  selectedDate,
  dailyAttendance
}: ReportGenerationProps): void => {
  let csvContent = "Date,Status,Time\n";
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get today's actual date for reference
  const today = new Date();
  
  // Get date 30 days ago from today
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Filter to include only the last 30 days from today
  const filteredWorkDays = workingDays.filter(date => {
    return date <= today && date >= thirtyDaysAgo;
  });

  const sortedDays = [...filteredWorkDays]
    .sort((a, b) => b.getTime() - a.getTime());
  
  sortedDays.forEach(date => {
    const isPresent = isDateInArray(date, attendanceDays);
    const isLate = isDateInArray(date, lateAttendanceDays);
    const isAbsent = isDateInArray(date, absentDays);
    
    let status = 'N/A';
    let timeInfo = '';
    
    if (isPresent) {
      status = 'Present';
    } else if (isLate) {
      status = 'Late';
    } else if (isAbsent) {
      status = 'Absent';
    }
    
    if ((isPresent || isLate) && 
        selectedDate &&
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear() && 
        dailyAttendance.length > 0) {
      const firstRecord = dailyAttendance[0];
      const recordTime = new Date(firstRecord.timestamp);
      timeInfo = recordTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    csvContent += `${formatDate(date)},${status},${(isPresent || isLate) ? timeInfo : '-'}\n`;
  });
  
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${selectedFace.name.replace(/\s+/g, '_')}_last_30_days_attendance.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

