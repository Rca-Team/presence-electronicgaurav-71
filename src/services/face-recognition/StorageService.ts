
import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (file: File, path: string, bucket: string = 'faces') => {
  try {
    console.log(`Uploading image to ${bucket}/${path}`);
    
    // Use the supabase storage API
    const result = await supabase.storage.from(bucket).upload(path, file);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getImageUrl = (path: string, bucket: string = 'faces') => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
