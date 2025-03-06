import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageLayout from '@/components/layouts/PageLayout';
import { Webcam } from '@/components/ui/webcam';
import { AboutMe } from '@/components/AboutMe';
import { cn } from '@/lib/utils';

const Index = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-in-left">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Introducing Presence
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Attendance Made <span className="text-primary">Simple</span> and <span className="text-primary">Secure</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl text-balance">
              Streamline your attendance process with advanced facial recognition technology. Fast, accurate, and privacy-focused.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" className="rounded-full px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative animate-slide-in-right">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl opacity-70"></div>
            <Card className="backdrop-panel overflow-hidden relative z-10">
              <Webcam 
                className="w-full" 
                autoStart={false}
                overlayClassName="border-primary/20"
              />
            </Card>
          </div>
        </div>
      </section>
      
      {/* About Me Section */}
      <section className="py-8 md:py-16">
        <AboutMe />
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
            Our platform makes attendance tracking effortless with cutting-edge facial recognition technology.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Register Faces",
              description: "Easily enroll users by capturing their facial data securely.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
              ),
              delay: "0ms"
            },
            {
              title: "Take Attendance",
              description: "One glance is all it takes to mark attendance in real-time.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
              ),
              delay: "100ms"
            },
            {
              title: "Generate Reports",
              description: "Access comprehensive attendance reports and analytics instantly.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path d="M8 17h8v-2H8v2zm0-4h8v-2H8v2zm0-4h4V7H8v2zm-2 8h12V5H6v12z" fill="currentColor"/>
                </svg>
              ),
              delay: "200ms"
            }
          ].map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover-lift animate-slide-in-up"
              style={{ animationDelay: feature.delay }}
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Advanced Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-slide-in-up">
            <h2 className="text-3xl font-bold mb-4">Advanced Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
              Explore the powerful capabilities that make Presence the leading solution for attendance management.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Face Data Storage in Firebase",
                description: "Securely store facial recognition data and attendance records in Firebase's robust cloud infrastructure.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M4 15s1-1 4-1 5 1 8 1 4-1 4-1M4 19s1-1 4-1 5 1 8 1 4-1 4-1M4 11s1-1 4-1 5 1 8 1 4-1 4-1" fill="currentColor"/>
                  </svg>
                ),
                delay: "0ms"
              },
              {
                title: "Daily & Monthly Attendance Reports",
                description: "Generate comprehensive attendance reports and export them as Excel or PDF files for easy record-keeping and analysis.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m6 0h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4m-6-4V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" fill="currentColor"/>
                  </svg>
                ),
                delay: "100ms"
              },
              {
                title: "Geofencing",
                description: "Enhance security by restricting attendance to specific geographic locations, ensuring authenticity of check-ins.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
                    <circle cx="12" cy="10" r="3" fill="white"/>
                  </svg>
                ),
                delay: "200ms"
              },
              {
                title: "Mobile-Friendly Design",
                description: "Access the full functionality of Presence from any device with our responsive interface optimized for both desktop and mobile.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" fill="currentColor"/>
                    <line x1="12" y1="18" x2="12" y2="18.01" stroke="white" strokeWidth="2"/>
                  </svg>
                ),
                delay: "300ms"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover-lift backdrop-panel animate-slide-in-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="backdrop-panel p-8 md:p-12 rounded-3xl animate-fade-in">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to transform your attendance system?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of organizations that trust Presence for reliable, secure attendance tracking.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="rounded-full px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
