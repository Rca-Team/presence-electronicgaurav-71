
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { 
      type, 
      studentId, 
      date, 
      parentEmail,
      studentName,
      schoolName = "School Attendance System" 
    } = await req.json()

    // Validate required parameters
    if (!type || !studentId || !date) {
      throw new Error('Missing required parameters: type, studentId, date')
    }

    // If parentEmail is not provided, try to fetch it from the database
    let recipientEmail = parentEmail
    if (!recipientEmail) {
      const { data: studentData, error: studentError } = await supabaseClient
        .from('attendance_records')
        .select('device_info')
        .eq('user_id', studentId)
        .contains('device_info', { registration: true })
        .single()

      if (studentError) throw studentError
      
      const deviceInfo = studentData?.device_info as any
      const metadata = deviceInfo?.metadata || {}
      
      recipientEmail = metadata.parent_email
      
      if (!recipientEmail) {
        throw new Error('Parent email not found for student')
      }
    }

    // Handle different notification types
    if (type === 'absence') {
      await sendAbsenceNotification(
        recipientEmail,
        studentName || 'your child',
        date,
        schoolName
      )
    } else if (type === 'late') {
      await sendLateNotification(
        recipientEmail,
        studentName || 'your child',
        date,
        schoolName
      )
    } else {
      throw new Error(`Unsupported notification type: ${type}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} notification sent to ${recipientEmail}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Notification service error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function sendAbsenceNotification(
  parentEmail: string,
  studentName: string,
  date: string,
  schoolName: string
) {
  const client = new SmtpClient();
  
  // Configure SMTP client with environment variables
  await client.connectTLS({
    hostname: Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com',
    port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
    username: Deno.env.get('SMTP_USERNAME') || '',
    password: Deno.env.get('SMTP_PASSWORD') || '',
  });

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  await client.send({
    from: Deno.env.get('SMTP_FROM') || 'attendance@school.edu',
    to: parentEmail,
    subject: `Absence Notification - ${studentName} - ${formattedDate}`,
    content: `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d32f2f;">${schoolName} - Absence Notification</h2>
          <p>Dear Parent/Guardian,</p>
          <p>This is to inform you that <strong>${studentName}</strong> was marked absent today, <strong>${formattedDate}</strong>.</p>
          <p>If you believe this is an error or if your child's absence was planned, please contact the school office to provide the necessary documentation.</p>
          <p>Regular attendance is crucial for academic success. Please ensure your child attends school regularly.</p>
          <p>Thank you for your cooperation.</p>
          <p>Sincerely,<br/>Attendance Office<br/>${schoolName}</p>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
    </html>
    `,
    html: true,
  });
  
  await client.close();
}

async function sendLateNotification(
  parentEmail: string,
  studentName: string,
  date: string,
  schoolName: string
) {
  const client = new SmtpClient();
  
  // Configure SMTP client with environment variables
  await client.connectTLS({
    hostname: Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com',
    port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
    username: Deno.env.get('SMTP_USERNAME') || '',
    password: Deno.env.get('SMTP_PASSWORD') || '',
  });

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  await client.send({
    from: Deno.env.get('SMTP_FROM') || 'attendance@school.edu',
    to: parentEmail,
    subject: `Late Arrival Notification - ${studentName} - ${formattedDate}`,
    content: `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #ff9800;">${schoolName} - Late Arrival Notification</h2>
          <p>Dear Parent/Guardian,</p>
          <p>This is to inform you that <strong>${studentName}</strong> arrived late to school today, <strong>${formattedDate}</strong>.</p>
          <p>If you believe this is an error or if there was a valid reason for the late arrival, please contact the school office.</p>
          <p>Being on time is important for your child's learning. Please ensure your child arrives at school on time.</p>
          <p>Thank you for your cooperation.</p>
          <p>Sincerely,<br/>Attendance Office<br/>${schoolName}</p>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
    </html>
    `,
    html: true,
  });
  
  await client.close();
}
