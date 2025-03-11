
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads an image to Supabase Storage.
 * Uses the 'public' bucket as the primary target instead of trying to create a new bucket.
 * 
 * @param file - The file to upload.
 * @param path - The storage path.
 * @param bucket - The storage bucket (default: 'public').
 * @returns The public URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string, bucket: string = 'public'): Promise<string> => {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file: The file is empty or invalid');
    }

    // Clean the path and make sure it doesn't have bucket prefix
    const cleanPath = path.replace(/^(faces|public)\//, '');
    const fullPath = bucket === 'public' ? `faces/${cleanPath}` : cleanPath;
    
    console.log(`Uploading image to ${bucket}/${fullPath}, file size: ${file.size} bytes`);

    // Upload to specified bucket (defaulting to 'public')
    let { data, error } = await supabase.storage.from(bucket).upload(fullPath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.warn(`Error uploading to '${bucket}': ${error.message}. Trying fallback method...`);
      
      // If primary bucket fails, always try the 'public' bucket which should exist by default
      if (bucket !== 'public') {
        ({ data, error } = await supabase.storage.from('public').upload(`faces/${cleanPath}`, file, {
          cacheControl: '3600',
          upsert: true,
        }));
      }

      if (error) {
        console.error('Upload failed to all buckets:', error.message);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('File uploaded successfully to public bucket:', data?.path);
      return supabase.storage.from('public').getPublicUrl(`faces/${cleanPath}`).publicUrl;
    }

    console.log('File uploaded successfully:', data?.path);
    return supabase.storage.from(bucket).getPublicUrl(fullPath).publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

/**
 * Retrieves the public URL of a file from Supabase Storage.
 * 
 * @param path - The storage path.
 * @param bucket - The storage bucket (default: 'public').
 * @returns The public URL of the file.
 */
export const getImageUrl = (path: string, bucket: string = 'public'): string => {
  // Clean up the path to ensure proper formatting
  const cleanPath = path.replace(/^(faces|public)\//, '');
  const fullPath = bucket === 'public' ? `faces/${cleanPath}` : cleanPath;
  return supabase.storage.from(bucket).getPublicUrl(fullPath).publicUrl;
};
