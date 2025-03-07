
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Admin credentials
export const ADMIN_EMAIL = 'admin@gmail.com';
export const ADMIN_PASSWORD = 'admin123';

export type AuthState = {
  isAdmin: boolean;
  isLoading: boolean;
};

// Check if user is logged in as admin
export const checkAdminAuth = async (): Promise<AuthState> => {
  const { data } = await supabase.auth.getSession();
  
  // If session exists, check if the email matches admin email
  if (data.session) {
    const { data: userData } = await supabase.auth.getUser();
    const isAdmin = userData?.user?.email === ADMIN_EMAIL;
    return { isAdmin, isLoading: false };
  }
  
  return { isAdmin: false, isLoading: false };
};

// Login function specifically for admin
export const loginAsAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate if it's the admin credentials
    if (email !== ADMIN_EMAIL) {
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Unexpected auth error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    toast({
      title: 'Signed out',
      description: 'You have been logged out successfully',
    });
  } catch (error) {
    console.error('Sign out error:', error);
    toast({
      title: 'Sign out failed',
      description: 'Failed to sign out. Please try again.',
      variant: 'destructive',
    });
  }
};
