import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBrainRecognition } from "@/hooks/useBrainRecognition";

interface ARCameraProps {
  onClose: () => void;
  onImageRecognized: (imageData: string) => void;
  topicTitle: string;
}

export const ARCamera = ({ onClose, onImageRecognized, topicTitle }: ARCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { recognizeImage, isLoading: modelLoading, initializeModel } = useBrainRecognition();

  useEffect(() => {
    startCamera();
    
    // Pre-load the ML model for brain recognition
    if (topicTitle === "Human Brain") {
      toast.info("Loading AI recognition model...");
      initializeModel().then(() => {
        toast.success("AI model ready!");
      }).catch(() => {
        toast.error("Failed to load AI model");
      });
    }
    
    return () => {
      stopCamera();
    };
  }, [topicTitle, initializeModel]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      
      toast.success("Camera ready! Point at your textbook");
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      
      // Use ML recognition for brain detection
      if (topicTitle === "Human Brain") {
        try {
          toast.info("Analyzing image with AI...");
          const result = await recognizeImage(imageData);
          
          if (result.detected) {
            setIsScanning(false);
            onImageRecognized(imageData);
            toast.success(`🧠 Brain detected! (${(result.confidence * 100).toFixed(0)}% confidence)\nLoading 3D model...`);
          } else {
            setIsScanning(false);
            toast.error(`❌ No brain detected\nTry pointing at: brain diagram, MRI scan, or anatomical illustration`);
          }
        } catch (error) {
          setIsScanning(false);
          toast.error("Recognition failed. Please try again.");
          console.error("Recognition error:", error);
        }
      } else {
        // For other topics, simulate recognition
        setTimeout(() => {
          setIsScanning(false);
          onImageRecognized(imageData);
          toast.success(`Recognized: ${topicTitle}! Loading 3D model...`);
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning frame */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-primary rounded-2xl pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary rounded-br-2xl" />
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 px-6 py-3 rounded-full flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-white text-sm">Recognizing...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full">
            <p className="text-white text-sm text-center">
              Point camera at textbook image of <span className="font-semibold text-secondary">{topicTitle}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
        <Button
          onClick={onClose}
          variant="outline"
          size="lg"
          className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
        
        <Button
          onClick={captureAndRecognize}
          disabled={isScanning}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:shadow-glow"
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Scan Image
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
