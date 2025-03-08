
import React from 'react';

const CalendarLegend: React.FC = () => {
  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
        <span className="text-sm">Present</span>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
        <span className="text-sm">Late</span>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
        <span className="text-sm">Absent</span>
      </div>
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-accent mr-2"></div>
        <span className="text-sm">Today (March 8)</span>
      </div>
    </div>
  );
};

export default CalendarLegend;
