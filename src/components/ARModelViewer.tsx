import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, PerspectiveCamera, Html, Line } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, ZoomIn, ZoomOut, Globe, Waves } from "lucide-react";
import { useRef, useState } from "react";
import * as THREE from "three";
import { toast } from "sonner";

interface Label3DProps {
  position: [number, number, number];
  text: string;
  surfacePosition: [number, number, number];
}

const Label3D = ({ position, text, surfacePosition }: Label3DProps) => {
  const { camera } = useThree();
  
  // Calculate if label is visible from camera perspective
  const labelWorldPos = new THREE.Vector3(...surfacePosition);
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  
  const cameraToLabel = labelWorldPos.clone().normalize();
  const dotProduct = cameraToLabel.dot(cameraDirection);
  
  // Hide labels on the back side of Earth (dot product < 0 means facing away)
  const isVisible = dotProduct > -0.3;
  
  if (!isVisible) return null;
  
  return (
    <group position={position}>
      {/* Thick pointer line from label to Earth surface */}
      <Line
        points={[
          [0, 0, 0],
          [surfacePosition[0] - position[0], surfacePosition[1] - position[1], surfacePosition[2] - position[2]]
        ]}
        color="white"
        lineWidth={3}
        dashed={false}
      />
      
      {/* HTML Label */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={8}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '700',
            whiteSpace: 'nowrap',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.5px',
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
};

interface Model3DProps {
  modelPath: string;
  showContinents: boolean;
  showOceans: boolean;
}

const Model3D = ({ modelPath, showContinents, showOceans }: Model3DProps) => {
  const { scene } = useGLTF(modelPath);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = scene.clone();
  
  // Earth labels with improved geological positions
  // Scale factor 1.5 is applied to the model, so positions are relative to that
  const continents = [
    { 
      name: "NORTH AMERICA", 
      position: [-3.2, 1.8, 0.8] as [number, number, number], 
      surfacePosition: [-1.1, 0.7, 0.3] as [number, number, number] 
    },
    { 
      name: "SOUTH AMERICA", 
      position: [-3.0, -1.5, 1.2] as [number, number, number], 
      surfacePosition: [-0.9, -0.6, 0.4] as [number, number, number] 
    },
    { 
      name: "EUROPE", 
      position: [1.2, 2.2, 1.8] as [number, number, number], 
      surfacePosition: [0.4, 0.9, 0.6] as [number, number, number] 
    },
    { 
      name: "AFRICA", 
      position: [1.8, -0.8, 2.5] as [number, number, number], 
      surfacePosition: [0.5, -0.3, 0.9] as [number, number, number] 
    },
    { 
      name: "ASIA", 
      position: [3.5, 1.5, -0.5] as [number, number, number], 
      surfacePosition: [1.2, 0.6, -0.2] as [number, number, number] 
    },
    { 
      name: "AUSTRALIA", 
      position: [3.2, -2.0, 0.8] as [number, number, number], 
      surfacePosition: [1.1, -0.8, 0.3] as [number, number, number] 
    },
    { 
      name: "ANTARCTICA", 
      position: [0.5, -3.2, 0.5] as [number, number, number], 
      surfacePosition: [0.2, -1.3, 0.2] as [number, number, number] 
    },
  ];

  const oceans = [
    { 
      name: "PACIFIC OCEAN", 
      position: [-3.8, 0.2, -1.5] as [number, number, number], 
      surfacePosition: [-1.3, 0.1, -0.6] as [number, number, number] 
    },
    { 
      name: "ATLANTIC OCEAN", 
      position: [-1.5, 0.8, 3.2] as [number, number, number], 
      surfacePosition: [-0.5, 0.3, 1.2] as [number, number, number] 
    },
    { 
      name: "INDIAN OCEAN", 
      position: [2.5, -1.2, 2.8] as [number, number, number], 
      surfacePosition: [0.9, -0.5, 1.1] as [number, number, number] 
    },
    { 
      name: "ARCTIC OCEAN", 
      position: [0.2, 3.5, 0.8] as [number, number, number], 
      surfacePosition: [0.1, 1.4, 0.3] as [number, number, number] 
    },
    { 
      name: "SOUTHERN OCEAN", 
      position: [-1.2, -3.0, -1.0] as [number, number, number], 
      surfacePosition: [-0.4, -1.2, -0.4] as [number, number, number] 
    },
  ];
  
  return (
    <group>
      <primitive object={clonedScene} scale={1.5} />
      
      {/* Continent Labels */}
      {showContinents && continents.map((continent) => (
        <Label3D
          key={continent.name}
          position={continent.position}
          text={continent.name}
          surfacePosition={continent.surfacePosition}
        />
      ))}
      
      {/* Ocean Labels */}
      {showOceans && oceans.map((ocean) => (
        <Label3D
          key={ocean.name}
          position={ocean.position}
          text={ocean.name}
          surfacePosition={ocean.surfacePosition}
        />
      ))}
    </group>
  );
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
  const [showContinents, setShowContinents] = useState(true);
  const [showOceans, setShowOceans] = useState(true);

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
      <div className="absolute inset-0 pointer-events-none">
        <Canvas className="w-full h-full pointer-events-auto">
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} zoom={zoom} />
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.8} />
          
          <Suspense fallback={null}>
            <Model3D modelPath={modelPath} showContinents={showContinents} showOceans={showOceans} />
            <Environment preset="city" />
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

      {/* Label Toggle Controls */}
      <div className="absolute top-32 left-0 right-0 z-10 flex justify-center gap-3">
        <Button
          onClick={() => setShowContinents(!showContinents)}
          variant="outline"
          size="sm"
          className={`backdrop-blur-sm border-white/20 transition-all ${
            showContinents 
              ? 'bg-white/90 text-black hover:bg-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          Continents
        </Button>
        
        <Button
          onClick={() => setShowOceans(!showOceans)}
          variant="outline"
          size="sm"
          className={`backdrop-blur-sm border-white/20 transition-all ${
            showOceans 
              ? 'bg-white/90 text-black hover:bg-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Waves className="w-4 h-4 mr-2" />
          Oceans
        </Button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-center gap-3">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="lg"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset View
          </Button>
          
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="lg"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
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
