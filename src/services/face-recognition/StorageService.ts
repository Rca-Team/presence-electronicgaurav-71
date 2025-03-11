
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

    // ALWAYS use 'public' bucket for storage - simplifies permissions and avoids bucket creation issues
    const safeBucket = 'public';
    
    // Clean the path and make sure it doesn't have bucket prefix
    const cleanPath = path.replace(/^(faces|public)\//, '');
    const fullPath = `faces/${cleanPath}`;
    
    console.log(`Uploading image to ${safeBucket}/${fullPath}, file size: ${file.size} bytes`);

    // Upload to public bucket with added retries
    let uploadSuccess = false;
    let attempt = 0;
    let data;
    let lastError;
    
    while (!uploadSuccess && attempt < 3) {
      try {
        const result = await supabase.storage.from(safeBucket).upload(fullPath, file, {
          cacheControl: '3600',
          upsert: true,
        });
        
        data = result.data;
        lastError = result.error;
        
        if (!lastError) {
          uploadSuccess = true;
          console.log(`File uploaded successfully on attempt ${attempt + 1}:`, data?.path);
        } else {
          console.warn(`Upload attempt ${attempt + 1} failed:`, lastError.message);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        lastError = err;
        console.warn(`Upload attempt ${attempt + 1} exception:`, err);
      }
      
      attempt++;
    }

    if (!uploadSuccess) {
      console.error('All upload attempts failed');
      // Return null to indicate failure - the calling code will handle fallback to base64
      throw new Error(`Upload failed after ${attempt} attempts: ${lastError?.message || 'Unknown error'}`);
    }

    // Success - return the public URL
    const publicUrlResult = supabase.storage.from(safeBucket).getPublicUrl(fullPath);
    return publicUrlResult.data.publicUrl;
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
  // Always use public bucket for consistency
  const safeBucket = 'public';
  
  // Clean up the path to ensure proper formatting
  const cleanPath = path.replace(/^(faces|public)\//, '');
  const fullPath = `faces/${cleanPath}`;
  
  return supabase.storage.from(safeBucket).getPublicUrl(fullPath).data.publicUrl;
};
