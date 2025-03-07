
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminAuth, loginAsAdmin, signOut, AuthState } from '@/services/auth/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAdmin: false,
    isLoading: true,
  });
  const navigate = useNavigate();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const state = await checkAdminAuth();
      setAuthState(state);
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      const state = await checkAdminAuth();
      setAuthState(state);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginAsAdmin(email, password);
    if (result.success) {
      setAuthState({ isAdmin: true, isLoading: false });
      navigate('/admin');
    }
    return result;
  };

  const logout = async () => {
    await signOut();
    setAuthState({ isAdmin: false, isLoading: false });
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Missing import - add this at the top
import { supabase } from '@/integrations/supabase/client';
