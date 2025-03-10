
import { supabase, storage } from '@/integrations/supabase/client';

export const uploadImage = async (file: File, path: string, bucket: string = 'faces') => {
  try {
    console.log(`Uploading image to ${bucket}/${path}`);
    
    // Use the storage export from supabase client
    const result = await storage.from(bucket).upload(path, file);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // Get public URL
    const { data } = storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getImageUrl = (path: string, bucket: string = 'faces') => {
  const { data } = storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
