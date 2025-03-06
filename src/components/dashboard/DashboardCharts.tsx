
import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Color constants
const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F', '#AAAAAA'];

interface DashboardChartsProps {
  isLoading: boolean;
  weeklyData?: any[];
  departmentData?: any[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  isLoading, 
  weeklyData, 
  departmentData 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-lg font-medium mb-4">Weekly Attendance</h3>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      
      <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-medium mb-4">Department Attendance</h3>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {departmentData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardCharts;
