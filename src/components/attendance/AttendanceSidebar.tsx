
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttendanceToday from './AttendanceToday';
import AttendanceStats from './AttendanceStats';

const AttendanceSidebar = () => {
  return (
    <div className="space-y-6 animate-slide-in-right">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4 pt-4">
          <AttendanceToday />
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4 pt-4">
          <AttendanceStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceSidebar;
