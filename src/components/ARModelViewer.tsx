import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, PerspectiveCamera } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import * as THREE from "three";

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
  const controlsRef = useRef<any>(null);
  const [zoom, setZoom] = useState(1);

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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background to-transparent p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{topicTitle}</h2>
            <p className="text-sm text-muted-foreground">Interactive 3D Model</p>
          </div>
          <Button onClick={onClose} variant="outline" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} zoom={zoom} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <Model3D modelPath={modelPath} />
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

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-center gap-3">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="lg"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset View
          </Button>
          
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="lg"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-24 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full">
          <p className="text-white text-sm">
            Drag to rotate • Scroll to zoom • Pinch to scale
          </p>
        </div>
      </div>
    </div>
  );
};
