
import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Color constants
const STATUS_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

interface StatusChartProps {
  isLoading: boolean;
  statusData?: Array<{name: string, value: number}>;
}

const StatusChart: React.FC<StatusChartProps> = ({ isLoading, statusData }) => {
  return (
    <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
      <h3 className="text-lg font-medium mb-4">Today's Status</h3>
      <div className="h-64">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {(statusData || []).map((entry: any, index: number) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
            ></div>
            <span className="text-sm">{entry.name}: {entry.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StatusChart;
