
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import SplashAnimation from "./components/SplashAnimation";

const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    const handleNavigation = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.classList.add('animate-fade-in');
        setTimeout(() => {
          mainContent.classList.remove('animate-fade-in');
        }, 500);
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Splash Animation */}
        {showSplash && (
          <SplashAnimation 
            onComplete={() => setShowSplash(false)}
            duration={3000} 
          />
        )}
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
