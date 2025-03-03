
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { Checkbox } from '@/components/ui/checkbox';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Login successful",
        description: "Welcome back to Presence",
      });
      
      navigate('/dashboard');
    }, 1500);
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
            <h1 className="text-4xl font-bold text-white mb-4">Welcome back to Presence</h1>
            <p className="text-lg text-white/80">
              Access your attendance dashboard and management tools with secure authentication.
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
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access the platform
            </p>
          </div>
          
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/90 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
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
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:text-primary/90 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
