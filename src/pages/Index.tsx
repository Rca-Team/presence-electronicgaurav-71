
import React from 'react';
import AnimationDemo from '../components/AnimationDemo';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Facial Recognition Attendance System
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your attendance tracking with our advanced facial recognition technology.
            Secure, efficient, and contactless.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/register">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">
                Login
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
      
      <AnimationDemo />
    </div>
  );
};

export default Index;
