import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, PerspectiveCamera, Text } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, ZoomIn, ZoomOut, Globe, Waves } from "lucide-react";
import { useRef, useState } from "react";
import * as THREE from "three";
import { toast } from "sonner";

interface Model3DProps {
  modelPath: string;
}

const Model3D = ({ modelPath }: Model3DProps) => {
  const { scene } = useGLTF(modelPath);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = scene.clone();
  
  return <primitive object={clonedScene} scale={1.5} />;
};

interface ARModelViewerProps {
  modelPath: string;
  topicTitle: string;
  onClose: () => void;
}

export const ARModelViewer = ({ modelPath, topicTitle, onClose }: ARModelViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const [zoom, setZoom] = useState(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [showContinents, setShowContinents] = useState(false);
  const [showOceans, setShowOceans] = useState(false);

  // Debug log
  console.log("AR Viewer loaded for:", topicTitle);
  console.log("Show continent buttons?", topicTitle === "Planet Earth");

  useEffect(() => {
    startCamera();
    requestDeviceOrientation();
    
    return () => {
      stopCamera();
    };
  }, []);

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
      
      toast.success("AR Mode Active! Move your camera to see the model from different angles");
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera for AR view");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const requestDeviceOrientation = () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    setDeviceOrientation({
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0
    });
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera Feed Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* AR Overlay Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{topicTitle}</h2>
            <p className="text-sm text-white/70">Augmented Reality View</p>
          </div>
          <Button onClick={onClose} variant="outline" size="icon" className="bg-black/50 border-white/20 text-white hover:bg-black/70">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ pointerEvents: 'none' }}>
        <Canvas className="w-full h-full" style={{ pointerEvents: 'auto' }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} zoom={zoom} />
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.8} />
          
          <Suspense fallback={null}>
            <Model3D modelPath={modelPath} />
            <Environment preset="city" />
            
            {/* Continent Labels */}
            {showContinents && (
              <>
                <Text position={[0, 0.5, 1.5]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  North America
                </Text>
                <Text position={[-0.3, -0.3, 1.5]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  South America
                </Text>
                <Text position={[0.5, 0.3, 1.4]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  Europe
                </Text>
                <Text position={[0.6, 0, 1.3]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  Africa
                </Text>
                <Text position={[1.2, 0.2, 0.8]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  Asia
                </Text>
                <Text position={[1.3, -0.5, 0.5]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  Australia
                </Text>
                <Text position={[0, -0.8, 0.5]} fontSize={0.15} color="#FFD700" anchorX="center" anchorY="middle">
                  Antarctica
                </Text>
              </>
            )}
            
            {/* Ocean Labels */}
            {showOceans && (
              <>
                <Text position={[-0.8, 0.3, 1]} fontSize={0.15} color="#00BFFF" anchorX="center" anchorY="middle">
                  Pacific Ocean
                </Text>
                <Text position={[0.3, 0.2, 1.5]} fontSize={0.15} color="#00BFFF" anchorX="center" anchorY="middle">
                  Atlantic Ocean
                </Text>
                <Text position={[1, 0, 1]} fontSize={0.15} color="#00BFFF" anchorX="center" anchorY="middle">
                  Indian Ocean
                </Text>
                <Text position={[0.2, 0.7, 1.2]} fontSize={0.15} color="#00BFFF" anchorX="center" anchorY="middle">
                  Arctic Ocean
                </Text>
                <Text position={[0, -0.9, 1]} fontSize={0.15} color="#00BFFF" anchorX="center" anchorY="middle">
                  Southern Ocean
                </Text>
              </>
            )}
          </Suspense>
          
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-[100]" style={{ pointerEvents: 'none' }}>
        <div className="container mx-auto flex flex-col items-center gap-4" style={{ pointerEvents: 'auto' }}>
          {/* Feature Buttons - Show only for Earth topic */}
          {topicTitle === "Planet Earth" && (
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={() => {
                  setShowContinents(!showContinents);
                  setShowOceans(false);
                  toast.success(showContinents ? "Continents hidden" : "Showing continents");
                }}
                variant="outline"
                size="lg"
                className={`backdrop-blur-md border-2 transition-all shadow-lg ${
                  showContinents 
                    ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-black/70 border-white/40 text-white hover:bg-black/90 hover:border-white/60'
                }`}
              >
                <Globe className="w-5 h-5 mr-2" />
                Continents
              </Button>
              
              <Button
                onClick={() => {
                  setShowOceans(!showOceans);
                  setShowContinents(false);
                  toast.success(showOceans ? "Oceans hidden" : "Showing oceans");
                }}
                variant="outline"
                size="lg"
                className={`backdrop-blur-md border-2 transition-all shadow-lg ${
                  showOceans 
                    ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-black/70 border-white/40 text-white hover:bg-black/90 hover:border-white/60'
                }`}
              >
                <Waves className="w-5 h-5 mr-2" />
                Oceans
              </Button>
            </div>
          )}
          
          {/* Navigation Controls */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="lg"
              className="bg-black/70 backdrop-blur-md border-2 border-white/40 text-white hover:bg-black/90 hover:border-white/60 shadow-lg"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="bg-black/70 backdrop-blur-md border-2 border-white/40 text-white hover:bg-black/90 hover:border-white/60 shadow-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset View
            </Button>
            
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="lg"
              className="bg-black/70 backdrop-blur-md border-2 border-white/40 text-white hover:bg-black/90 hover:border-white/60 shadow-lg"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* AR Instructions */}
      <div className="absolute top-24 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/30">
          <p className="text-white text-sm">
            🌍 AR Mode Active • Move camera to explore • Drag to rotate
          </p>
        </div>
      </div>
    </div>
  );
};
