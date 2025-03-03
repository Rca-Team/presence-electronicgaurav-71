
import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data for charts
const attendanceData = [
  { name: 'Mon', value: 85 },
  { name: 'Tue', value: 92 },
  { name: 'Wed', value: 88 },
  { name: 'Thu', value: 91 },
  { name: 'Fri', value: 84 },
  { name: 'Sat', value: 72 },
  { name: 'Sun', value: 65 },
];

const departmentData = [
  { name: 'Engineering', value: 92 },
  { name: 'Marketing', value: 85 },
  { name: 'Finance', value: 88 },
  { name: 'HR', value: 94 },
  { name: 'Operations', value: 80 },
];

const statusData = [
  { name: 'Present', value: 85 },
  { name: 'Absent', value: 10 },
  { name: 'Late', value: 5 },
];

const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#00C49F', '#AAAAAA'];
const STATUS_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const Dashboard = () => {
  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your attendance statistics and analytics"
        className="animate-slide-in-down"
      >
        <Link to="/attendance">
          <Button>Take Attendance</Button>
        </Link>
      </PageHeader>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-up">
        <StatCard
          title="Total Employees"
          value="124"
          trend={{ value: 12, positive: true }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />
        
        <StatCard
          title="Present Today"
          value="105"
          description="85% attendance rate"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          }
        />
        
        <StatCard
          title="Average Weekly"
          value="82%"
          trend={{ value: 5, positive: true }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          }
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-medium mb-4">Weekly Attendance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
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
          </div>
        </Card>
        
        <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-medium mb-4">Department Attendance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 md:col-span-2 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { name: 'John Doe', time: '08:32 AM', status: 'Checked in' },
              { name: 'Jane Smith', time: '08:45 AM', status: 'Checked in' },
              { name: 'Michael Brown', time: '09:01 AM', status: 'Checked in (Late)' },
              { name: 'Emily Johnson', time: '08:15 AM', status: 'Checked in' },
              { name: 'Robert Davis', time: '08:28 AM', status: 'Checked in' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">{item.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  item.status.includes('Late') 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-medium mb-4">Today's Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((entry, index) => (
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
      </div>
    </PageLayout>
  );
};

export default Dashboard;
