
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Save } from 'lucide-react';
import { sendAbsenceNotification, sendLateNotification } from '@/services/notification/NotificationService';

interface ParentContactInfoProps {
  studentId: string | null;
}

const ParentContactInfo: React.FC<ParentContactInfoProps> = ({ studentId }) => {
  const { toast } = useToast();
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchParentContactInfo(studentId);
    } else {
      resetForm();
    }
  }, [studentId]);

  const fetchParentContactInfo = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, device_info')
        .eq('user_id', id)
        .contains('device_info', { registration: true })
        .single();

      if (error) throw error;

      if (data && data.id) {
        setRecordId(data.id);
        const deviceInfo = data.device_info as any;
        const metadata = deviceInfo?.metadata || {};
        
        setParentEmail(metadata.parent_email || '');
        setParentPhone(metadata.parent_phone || '');
        setStudentName(metadata.name || 'Unknown Student');
      }
    } catch (error) {
      console.error('Error fetching parent contact info:', error);
      toast({
        title: "Error",
        description: "Failed to load parent contact information",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setParentEmail('');
    setParentPhone('');
    setStudentName('');
    setRecordId(null);
  };

  const handleSave = async () => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "No student selected",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      // First get the current record
      const { data: currentData, error: fetchError } = await supabase
        .from('attendance_records')
        .select('id, device_info')
        .eq('user_id', studentId)
        .contains('device_info', { registration: true })
        .single();

      if (fetchError) throw fetchError;

      if (!currentData) {
        throw new Error('Student record not found');
      }

      // Update the device_info metadata
      const deviceInfo = currentData.device_info as any;
      const metadata = deviceInfo?.metadata || {};
      
      const updatedMetadata = {
        ...metadata,
        parent_email: parentEmail,
        parent_phone: parentPhone
      };

      const updatedDeviceInfo = {
        ...deviceInfo,
        metadata: updatedMetadata
      };

      // Update the record
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({ device_info: updatedDeviceInfo })
        .eq('id', currentData.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Parent contact information saved successfully",
      });
    } catch (error) {
      console.error('Error saving parent contact info:', error);
      toast({
        title: "Error",
        description: "Failed to save parent contact information",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestNotification = async (type: 'absence' | 'late') => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "No student selected",
        variant: "destructive"
      });
      return;
    }

    if (!parentEmail) {
      toast({
        title: "Error",
        description: "Parent email is required to send a test notification",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSending(true);
      
      const result = type === 'absence'
        ? await sendAbsenceNotification(studentId, studentName, parentEmail)
        : await sendLateNotification(studentId, studentName, parentEmail);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: `Test ${type} notification sent to ${parentEmail}`,
      });
    } catch (error) {
      console.error(`Error sending test ${type} notification:`, error);
      toast({
        title: "Error",
        description: `Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!studentId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Select a student to manage parent contact information
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="parent-email" className="block text-sm font-medium mb-1">
            Parent Email
          </label>
          <Input
            id="parent-email"
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
          />
        </div>
        <div>
          <label htmlFor="parent-phone" className="block text-sm font-medium mb-1">
            Parent Phone
          </label>
          <Input
            id="parent-phone"
            type="tel"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="+1234567890"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex w-full justify-between">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Contact Info
              </>
            )}
          </Button>
        </div>
        
        <div className="flex w-full gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSendTestNotification('absence')} 
            disabled={isSending || !parentEmail}
            className="w-full"
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Absence Email
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => handleSendTestNotification('late')} 
            disabled={isSending || !parentEmail}
            className="w-full"
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Late Email
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ParentContactInfo;
