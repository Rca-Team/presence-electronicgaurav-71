
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { Checkbox } from '@/components/ui/checkbox';

const Login = () => {
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
            <h1 className="text-4xl font-bold text-white mb-4">Login Page</h1>
            <p className="text-lg text-white/80">
              This is a demo login page. Authentication has been removed.
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
            <h2 className="text-2xl font-bold">Login</h2>
            <p className="mt-2 text-muted-foreground">
              Authentication has been removed. This is a demo page.
            </p>
          </div>
          
          <Card className="p-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@example.com" 
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
                />
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
              
              <Button type="button" className="w-full">
                Sign In
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
