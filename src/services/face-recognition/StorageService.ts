
import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (file: File, path: string, bucket: string = 'faces') => {
  try {
    console.log(`Uploading image to ${bucket}/${path}, file size: ${file.size} bytes`);
    
    // Validate input
    if (!file || file.size === 0) {
      throw new Error('Invalid file: The file is empty or invalid');
    }
    
    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      throw new Error(`Cannot access storage: ${bucketError.message}`);
    }
    
    const bucketExists = buckets.some(b => b.name === bucket);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucket}' does not exist, attempting to create it`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880 // 5MB limit for face images
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      console.log(`Bucket '${bucket}' created successfully`);
    }
    
    // Use the supabase storage API
    const result = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
    if (result.error) {
      console.error('Error uploading file:', result.error);
      throw new Error(`Upload failed: ${result.error.message}`);
    }
    
    console.log('File uploaded successfully:', result.data?.path);
    
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log('Public URL generated:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

export const getImageUrl = (path: string, bucket: string = 'faces') => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
