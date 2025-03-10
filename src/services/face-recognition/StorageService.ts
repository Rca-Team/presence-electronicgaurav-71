import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads an image to Supabase Storage.
 * If the upload fails in the primary bucket, it attempts to upload to the 'public' bucket.
 * 
 * @param file - The file to upload.
 * @param path - The storage path.
 * @param bucket - The storage bucket (default: 'faces').
 * @returns The public URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string, bucket: string = 'faces'): Promise<string> => {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file: The file is empty or invalid');
    }

    const cleanPath = path.replace(`${bucket}/`, '');
    console.log(`Uploading image to ${bucket}/${cleanPath}, file size: ${file.size} bytes`);

    // Attempt to upload to the specified bucket
    let { data, error } = await supabase.storage.from(bucket).upload(cleanPath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    // If upload fails, attempt to upload to the fallback 'public' bucket
    if (error) {
      console.warn(`Error uploading to '${bucket}': ${error.message}. Trying 'public' bucket instead...`);
      ({ data, error } = await supabase.storage.from('public').upload(`faces/${cleanPath}`, file, {
        cacheControl: '3600',
        upsert: true,
      }));

      if (error) {
        console.error('Upload failed to both buckets:', error.message);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('File uploaded successfully to public bucket:', data?.path);
      return supabase.storage.from('public').getPublicUrl(`faces/${cleanPath}`).publicUrl;
    }

    console.log('File uploaded successfully:', data?.path);
    return supabase.storage.from(bucket).getPublicUrl(cleanPath).publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

/**
 * Retrieves the public URL of a file from Supabase Storage.
 * 
 * @param path - The storage path.
 * @param bucket - The storage bucket (default: 'faces').
 * @returns The public URL of the file.
 */
export const getImageUrl = (path: string, bucket: string = 'faces'): string => {
  const cleanPath = path.startsWith(`${bucket}/`) ? path.replace(`${bucket}/`, '') : path;
  return supabase.storage.from(bucket).getPublicUrl(cleanPath).publicUrl;
};
