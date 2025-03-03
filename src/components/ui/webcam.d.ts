
// Define the Webcam component props
export interface WebcamProps {
  onCapture?: (imageData: string) => void;
  showControls?: boolean;
  className?: string;
  overlayClassName?: string;
  autoStart?: boolean;
  ref?: React.Ref<HTMLVideoElement>;
}
