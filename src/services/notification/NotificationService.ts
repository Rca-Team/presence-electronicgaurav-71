
import { supabase } from '@/integrations/supabase/client';

interface NotificationParams {
  type: 'absence' | 'late';
  studentId: string;
  date: string;
  parentEmail?: string;
  studentName?: string;
  schoolName?: string;
}

/**
 * Send a notification to a parent/guardian about student attendance
 */
export async function sendParentNotification({
  type,
  studentId,
  date,
  parentEmail,
  studentName,
  schoolName
}: NotificationParams): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log(`Sending ${type} notification for student ${studentId}`);
    
    const { data, error } = await supabase.functions.invoke('notification-service', {
      body: {
        type,
        studentId,
        date,
        parentEmail,
        studentName,
        schoolName
      }
    });
    
    if (error) throw error;
    
    console.log('Notification service response:', data);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error sending notification'
    };
  }
}

/**
 * Send absence notification
 */
export async function sendAbsenceNotification(
  studentId: string,
  studentName?: string,
  parentEmail?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const today = new Date().toISOString().split('T')[0];
  
  return sendParentNotification({
    type: 'absence',
    studentId,
    date: today,
    studentName,
    parentEmail
  });
}

/**
 * Send late arrival notification
 */
export async function sendLateNotification(
  studentId: string,
  studentName?: string,
  parentEmail?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const today = new Date().toISOString().split('T')[0];
  
  return sendParentNotification({
    type: 'late',
    studentId,
    date: today,
    studentName,
    parentEmail
  });
}
