
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

interface SplashAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashAnimation: React.FC<SplashAnimationProps> = ({
  onComplete,
  duration = 3000,
}) => {
  const [animationState, setAnimationState] = useState<'initial' | 'animate' | 'exit'>('initial');

  useEffect(() => {
    // Start animation immediately
    setAnimationState('animate');

    // Set timeout for exiting
    const timer = setTimeout(() => {
      setAnimationState('exit');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Additional time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={cn(
      "fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-xl",
      animationState === 'initial' && 'opacity-0',
      animationState === 'animate' && 'opacity-100 transition-opacity duration-700',
      animationState === 'exit' && 'opacity-0 transition-opacity duration-500'
    )}>
      <div className={cn(
        "flex flex-col items-center",
        animationState === 'initial' && 'scale-95 opacity-0',
        animationState === 'animate' && 'scale-100 opacity-100 transition-all duration-1000',
        animationState === 'exit' && 'scale-110 opacity-0 transition-all duration-500'
      )}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse blur-xl"></div>
          <div className="relative">
            <Logo size="lg" className="text-4xl md:text-5xl animate-float" />
          </div>
        </div>
        
        <div className={cn(
          "mt-6 overflow-hidden h-1 bg-white/20 rounded-full w-48",
          animationState === 'animate' && 'animate-pulse-subtle'
        )}>
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{
              width: animationState === 'animate' ? '100%' : '0%',
              transition: 'width 2.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          ></div>
        </div>
        
        <p className={cn(
          "mt-4 text-white/90 font-medium tracking-wider text-sm",
          animationState === 'initial' && 'opacity-0',
          animationState === 'animate' && 'opacity-100 transition-opacity delay-500 duration-1000',
          animationState === 'exit' && 'opacity-0 transition-opacity duration-300'
        )}>
          PRESENCE
        </p>
      </div>
    </div>
  );
};

export default SplashAnimation;
