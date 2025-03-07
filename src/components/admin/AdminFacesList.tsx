
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trash2, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminFacesListProps {
  viewMode: 'grid' | 'list';
  selectedFaceId: string | null;
  setSelectedFaceId: (id: string | null) => void;
  updateTrigger?: number;
}

const AdminFacesList: React.FC<AdminFacesListProps> = ({
  viewMode,
  selectedFaceId,
  setSelectedFaceId,
  updateTrigger = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [faces, setFaces] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFaces();
  }, [updateTrigger, searchQuery]); 

  const fetchFaces = async () => {
    setIsLoading(true);
    try {
      // Instead of querying a non-existent "faces" table, we'll query attendance_records
      // and filter the ones that are registrations (as implemented in the app)
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('status', 'present')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Filter records to get only registration records
      const registrationFaces = (data || []).filter(record => {
        if (record.device_info && typeof record.device_info === 'object') {
          const deviceInfo = record.device_info as any;
          // Check if this is a registration record
          if (deviceInfo.registration && deviceInfo.metadata && deviceInfo.metadata.name) {
            // Filter by search query if there is one
            if (searchQuery) {
              return deviceInfo.metadata.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
          }
        }
        return false;
      });

      // Convert the filtered registration records to our faces format
      const formattedFaces = registrationFaces.map(record => {
        const deviceInfo = record.device_info as any;
        return {
          id: deviceInfo.employee_id || record.id,
          name: deviceInfo.metadata.name,
          department: deviceInfo.metadata.department || 'N/A',
          position: deviceInfo.metadata.position || 'N/A',
          image_url: deviceInfo.metadata.firebase_image_url || 'https://via.placeholder.com/150',
          timestamp: record.timestamp
        };
      });

      setFaces(formattedFaces);
    } catch (error) {
      console.error('Error fetching faces:', error);
      toast({
        title: 'Error fetching faces',
        description: 'Could not load faces. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFace = async (id: string) => {
    if (confirm('Are you sure you want to delete this face?')) {
      try {
        // Find the original attendance_records entry for this face
        const { data, error: findError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('status', 'present');
          
        if (findError) throw findError;
        
        // Find the record with matching employee_id
        const recordToDelete = (data || []).find(record => {
          const deviceInfo = record.device_info as any;
          return deviceInfo && 
                 deviceInfo.registration && 
                 deviceInfo.employee_id === id;
        });
        
        if (!recordToDelete) {
          throw new Error('Face registration record not found');
        }
        
        // Delete the record
        const { error: deleteError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('id', recordToDelete.id);

        if (deleteError) throw deleteError;

        toast({
          title: 'Face deleted',
          description: 'The face has been successfully deleted.',
        });
        
        // Refresh the list after deletion
        fetchFaces();
        
        // If deleted face was selected, clear selection
        if (selectedFaceId === id) {
          setSelectedFaceId(null);
        }
      } catch (error) {
        console.error('Error deleting face:', error);
        toast({
          title: 'Error deleting face',
          description: 'Could not delete the face. Please try again later.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center mb-4">
          <Input
            placeholder="Search faces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mr-2"
          />
          <Button onClick={fetchFaces}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
            {faces.map((face) => (
              <Card key={face.id} className={`p-4 ${selectedFaceId === face.id ? 'border border-blue-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={face.image_url} alt={face.name} className="h-10 w-10 rounded-full mr-2" />
                    <div>
                      <h3 className="font-medium">{face.name}</h3>
                      <p className="text-sm text-muted-foreground">{face.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="outline" onClick={() => setSelectedFaceId(face.id)}>
                      <User className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDeleteFace(face.id)} className="ml-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {faces.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No faces found. Register new faces using the registration page.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFacesList;
