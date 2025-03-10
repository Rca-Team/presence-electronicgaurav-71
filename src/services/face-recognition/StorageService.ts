
import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (file: File, path: string, bucket: string = 'faces') => {
  try {
    // Clean up the path to avoid double directory names
    const cleanPath = path.replace(`${bucket}/`, '');
    console.log(`Uploading image to ${bucket}/${cleanPath}, file size: ${file.size} bytes`);
    
    // Validate input
    if (!file || file.size === 0) {
      throw new Error('Invalid file: The file is empty or invalid');
    }
    
    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      
      // Instead of trying to create a bucket (which might fail due to permissions),
      // let's try to upload to a public bucket that should already exist
      console.log('Attempting to upload to an existing bucket');
      
      // Try to upload to the default bucket
      const result = await supabase.storage.from(bucket).upload(cleanPath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
      if (result.error) {
        // If this also fails, try an alternative approach - upload to 'public' bucket
        console.log('Trying to upload to public bucket instead');
        const publicResult = await supabase.storage.from('public').upload(`faces/${cleanPath}`, file, {
          cacheControl: '3600',
          upsert: true
        });
        
        if (publicResult.error) {
          console.error('Error uploading to public bucket:', publicResult.error);
          throw new Error(`Upload failed: ${publicResult.error.message}`);
        }
        
        console.log('File uploaded successfully to public bucket:', publicResult.data?.path);
        const { data } = supabase.storage.from('public').getPublicUrl(`faces/${cleanPath}`);
        console.log('Public URL generated:', data.publicUrl);
        return data.publicUrl;
      }
      
      console.log('File uploaded successfully to original bucket:', result.data?.path);
      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
      console.log('Public URL generated:', data.publicUrl);
      return data.publicUrl;
    }
    
    const bucketExists = buckets.some(b => b.name === bucket);
    
    if (!bucketExists) {
      console.log(`Bucket '${bucket}' does not exist`);
      
      // Instead of trying to create it, we'll try to use the public bucket
      console.log('Attempting to upload to public bucket instead');
      const publicResult = await supabase.storage.from('public').upload(`faces/${cleanPath}`, file, {
        cacheControl: '3600',
        upsert: true
      });
      
      if (publicResult.error) {
        console.error('Error uploading to public bucket:', publicResult.error);
        throw new Error(`Upload failed: ${publicResult.error.message}`);
      }
      
      console.log('File uploaded successfully to public bucket:', publicResult.data?.path);
      const { data } = supabase.storage.from('public').getPublicUrl(`faces/${cleanPath}`);
      console.log('Public URL generated:', data.publicUrl);
      return data.publicUrl;
    }
    
    // Use the supabase storage API
    const result = await supabase.storage.from(bucket).upload(cleanPath, file, {
      cacheControl: '3600',
      upsert: true
    });
    
    if (result.error) {
      console.error('Error uploading file:', result.error);
      throw new Error(`Upload failed: ${result.error.message}`);
    }
    
    console.log('File uploaded successfully:', result.data?.path);
    
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    console.log('Public URL generated:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

export const getImageUrl = (path: string, bucket: string = 'faces') => {
  // Check if the path already includes the bucket prefix
  if (path.startsWith(`${bucket}/`)) {
    const cleanPath = path.replace(`${bucket}/`, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data.publicUrl;
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
