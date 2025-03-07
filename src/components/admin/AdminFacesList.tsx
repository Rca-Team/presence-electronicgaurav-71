import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trash2, Search, User, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminFacesListProps {
  viewMode: 'grid' | 'list';
  selectedFaceId: string | null;
  setSelectedFaceId: (id: string | null) => void;
  updateTrigger?: number; // Add update trigger prop
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
  }, [updateTrigger]); // Add updateTrigger to dependencies

  const fetchFaces = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faces')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      if (error) throw error;

      setFaces(data || []);
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
        const { error } = await supabase
          .from('faces')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Face deleted',
          description: 'The face has been successfully deleted.',
        });
        fetchFaces(); // Refresh the list after deletion
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
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFacesList;
