
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3600  // Default animation duration in ms
}) => {
  const [animationStage, setAnimationStage] = useState<'initial' | 'logo-in' | 'pulse' | 'logo-out' | 'complete'>('initial');

  useEffect(() => {
    // Start animation sequence
    const timeline = [
      { stage: 'logo-in', time: 100 },
      { stage: 'pulse', time: 1600 },
      { stage: 'logo-out', time: 3000 },
      { stage: 'complete', time: 3500 }
    ];

    timeline.forEach(({ stage, time }) => {
      setTimeout(() => {
        setAnimationStage(stage as any);
      }, time);
    });

    // Call onComplete after animation is done
    if (onComplete) {
      setTimeout(onComplete, duration);
    }
  }, [onComplete, duration]);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-500",
      animationStage === 'initial' ? 'opacity-0' : 
      animationStage === 'logo-out' ? 'opacity-0' : 
      animationStage === 'complete' ? 'opacity-0 pointer-events-none' : 
      'opacity-100'
    )}>
      <div className={cn(
        "transform transition-all duration-700 scale-75",
        animationStage === 'initial' ? 'opacity-0 scale-95' : 
        animationStage === 'logo-in' ? 'opacity-100 scale-100' : 
        animationStage === 'pulse' ? 'opacity-100 scale-100' : 
        animationStage === 'logo-out' ? 'opacity-0 scale-110' : 
        'opacity-0 scale-110'
      )}>
        <div className="relative">
          {/* Animated glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-3xl bg-white blur-xl",
            animationStage === 'pulse' ? 'animate-pulse-subtle' : '',
          )}></div>
          
          {/* Main logo */}
          <Logo 
            size="lg" 
            className="text-white relative z-10"
          />
          
          {/* Animated rings */}
          <div className={cn(
            "absolute -inset-4 border border-white/20 rounded-full",
            animationStage === 'pulse' ? 'animate-ping' : '',
            "opacity-0 transition-opacity duration-300",
            animationStage === 'pulse' ? 'opacity-100' : ''
          )}></div>
          
          <div className={cn(
            "absolute -inset-8 border border-white/10 rounded-full",
            animationStage === 'pulse' ? 'animate-ping animation-delay-300' : '',
            "opacity-0 transition-opacity duration-300",
            animationStage === 'pulse' ? 'opacity-100' : ''
          )}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
