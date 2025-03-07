
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL } from '@/services/auth/authService';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  // If already logged in as admin, redirect to admin page
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, remember: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { success, error } = await login(formData.email, formData.password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome to Admin Dashboard",
        });
      } else {
        toast({
          title: "Login failed",
          description: error || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Image Section */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1974&auto=format&fit=crop')`,
            backgroundSize: 'cover'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent"></div>
        </div>
        <div className="relative h-full flex items-center p-12">
          <div className="max-w-xl">
            <Logo size="lg" className="text-white mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Admin Access Only</h1>
            <p className="text-lg text-white/80">
              Access the admin dashboard with secure authentication.
            </p>
          </div>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden">
              <Logo className="mx-auto lg:mx-0 mb-6" />
            </div>
            <h2 className="text-2xl font-bold">Admin Login</h2>
            <p className="mt-2 text-muted-foreground">
              Enter admin credentials to access the platform
            </p>
            <div className="mt-2 p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Use <span className="font-mono">{ADMIN_EMAIL}</span> and password to sign in
              </p>
            </div>
          </div>
          
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={formData.remember}
                  onCheckedChange={handleCheckboxChange}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 mr-2 rounded-full border-2 border-current border-r-transparent animate-spin"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Card>
          
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Back to{" "}
              <Link to="/" className="text-primary hover:text-primary/90 transition-colors font-medium">
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
