
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface AnimatedPopupProps {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  footerContent?: React.ReactNode;
  animation?: "zoom" | "slide" | "fade" | "bounce";
}

export function AnimatedPopup({
  title,
  description,
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  footerContent,
  animation = "zoom",
}: AnimatedPopupProps) {
  const [animationClass, setAnimationClass] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      // Set animation class based on the animation prop
      switch (animation) {
        case "zoom":
          setAnimationClass("animate-scale-in");
          break;
        case "slide":
          setAnimationClass("animate-slide-in-up");
          break;
        case "fade":
          setAnimationClass("animate-fade-in");
          break;
        case "bounce":
          setAnimationClass("animate-bounce");
          break;
        default:
          setAnimationClass("animate-scale-in");
      }
    }
  }, [isOpen, animation]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "bg-white dark:bg-card border border-border shadow-lg",
          animationClass,
          className
        )}
      >
        {showCloseButton && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        
        {children}
        
        {footerContent && (
          <DialogFooter>{footerContent}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
