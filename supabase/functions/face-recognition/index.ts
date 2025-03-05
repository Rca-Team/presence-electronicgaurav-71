
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Log the environment variables (safely)
    console.log('SUPABASE_URL available:', !!Deno.env.get('SUPABASE_URL'));
    console.log('SUPABASE_ANON_KEY available:', !!Deno.env.get('SUPABASE_ANON_KEY'));
    
    // Create Supabase client with fallback values if needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ulqeiwqodhltoibeqzlp.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscWVpd3FvZGhsdG9pYmVxemxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzA5MjgsImV4cCI6MjA1Njc0NjkyOH0.tEcTfAx4nisb_SaHE1GNAEcfLwbLgNJMXHrTw8wpGw0';
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    )
    
    // Parse request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    const { operation } = requestData;
    
    // Health check endpoint for model status
    if (operation === 'healthCheck') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'Face recognition service is running',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    // Sample function to get attendance statistics
    if (operation === 'getAttendanceStats') {
      const today = new Date().toISOString().split('T')[0]
      
      // Get total employees
      const { data: employeesData, error: employeesError } = await supabaseClient
        .from('employees')
        .select('id')
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      const totalEmployees = employeesData?.length || 0
      
      // Get present employees today
      const { data: presentData, error: presentError } = await supabaseClient
        .from('attendance_dates')
        .select('id')
        .eq('date', today)
      
      if (presentError) {
        console.error('Error fetching present employees:', presentError);
        throw presentError;
      }
      
      const presentEmployees = presentData?.length || 0
      
      // Get late employees today
      const { data: lateData, error: lateError } = await supabaseClient
        .from('attendance_records')
        .select('id')
        .eq('status', 'late')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
      
      if (lateError) {
        console.error('Error fetching late employees:', lateError);
        throw lateError;
      }
      
      const lateEmployees = lateData?.length || 0
      
      // Calculate absent employees
      const absentEmployees = Math.max(0, totalEmployees - presentEmployees)
      
      return new Response(
        JSON.stringify({
          present: presentEmployees,
          late: lateEmployees,
          absent: absentEmployees,
          total: totalEmployees,
          presentPercentage: totalEmployees > 0 ? Math.round((presentEmployees / totalEmployees) * 100) : 0,
          latePercentage: totalEmployees > 0 ? Math.round((lateEmployees / totalEmployees) * 100) : 0,
          absentPercentage: totalEmployees > 0 ? Math.round((absentEmployees / totalEmployees) * 100) : 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    // Handler for future operations
    return new Response(
      JSON.stringify({ error: 'Unknown operation', requestedOperation: operation }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  } catch (error) {
    console.error('Face recognition function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
