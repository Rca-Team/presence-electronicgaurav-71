
import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { supabase } from '@/integrations/supabase/client';

const AttendanceStats = () => {
  const [stats, setStats] = useState({
    present: 0,
    unauthorized: 0,
    absent: 0,
    total: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }
      
      const totalProfiles = profilesData?.length || 0;
      
      const { data: presentData, error: presentError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'present')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (presentError) {
        console.error('Error fetching present users:', presentError);
        return;
      }
      
      const presentUsers = presentData?.length || 0;
      
      const { data: unauthorizedData, error: unauthorizedError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'unauthorized')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (unauthorizedError) {
        console.error('Error fetching unauthorized users:', unauthorizedError);
        return;
      }
      
      const unauthorizedUsers = unauthorizedData?.length || 0;
      
      const absentUsers = Math.max(0, totalProfiles - presentUsers - unauthorizedUsers);
      
      setStats({
        present: presentUsers,
        unauthorized: unauthorizedUsers,
        absent: absentUsers,
        total: totalProfiles
      });
    };
    
    fetchStats();
  }, []);

  return (
    <>
      <StatCard
        title="Present Today"
        value={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'}
        description={`${stats.present} out of ${stats.total} profiles`}
        className="mb-4"
      />
      
      <StatCard
        title="Late Arrivals"
        value={String(stats.unauthorized)}
        description={stats.total > 0 ? `${Math.round((stats.unauthorized / stats.total) * 100)}% of total profiles` : '0% of total profiles'}
        className="mb-4"
      />
      
      <StatCard
        title="Absent"
        value={String(stats.absent)}
        description={stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}% of total profiles` : '0% of total profiles'}
      />
    </>
  );
};

export default AttendanceStats;
