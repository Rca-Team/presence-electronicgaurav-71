
import React, { useState } from 'react';
import { AnimatedPopup } from './ui/animated-popup';
import { Button } from './ui/button';

const AnimationDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [animation, setAnimation] = useState<"zoom" | "slide" | "fade" | "bounce">("zoom");

  const openPopup = (animationType: "zoom" | "slide" | "fade" | "bounce") => {
    setAnimation(animationType);
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8">
      <h2 className="text-2xl font-bold text-primary">Popup Animation Demo</h2>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={() => openPopup("zoom")} variant="default">
          Zoom Animation
        </Button>
        <Button onClick={() => openPopup("slide")} variant="default">
          Slide Animation
        </Button>
        <Button onClick={() => openPopup("fade")} variant="default">
          Fade Animation
        </Button>
        <Button onClick={() => openPopup("bounce")} variant="default">
          Bounce Animation
        </Button>
      </div>
      
      <AnimatedPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Animated Popup"
        description="This popup demonstrates different animation effects"
        animation={animation}
        footerContent={
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        }
      >
        <div className="py-6">
          <p className="text-center text-foreground">
            You selected the <span className="font-bold text-primary">{animation}</span> animation!
          </p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm">
              Try clicking on different animation buttons to see various effects.
            </p>
          </div>
        </div>
      </AnimatedPopup>
    </div>
  );
};

export default AnimationDemo;
