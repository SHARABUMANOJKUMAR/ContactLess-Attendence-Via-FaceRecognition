import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import logo from '@/assets/logo.png';

interface LogoMeshProps {
  mousePosition: { x: number; y: number };
}

function LogoMesh({ mousePosition }: LogoMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(logo);

  // Smooth rotation based on mouse position
  useFrame(() => {
    if (meshRef.current) {
      // Target rotation based on mouse
      const targetRotationX = mousePosition.y * 0.5;
      const targetRotationY = mousePosition.x * 0.5;

      // Smooth interpolation
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.05;
      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.05;

      // Add subtle floating animation
      meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.5}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        emissive="#ffd700"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

export function Logo3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="w-32 h-32 relative cursor-move"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        <spotLight 
          position={[0, 5, 5]} 
          angle={0.3} 
          penumbra={1} 
          intensity={2}
          color="#ffd700"
        />
        <LogoMesh mousePosition={mousePosition} />
      </Canvas>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-gold rounded-full blur-xl opacity-50 -z-10"></div>
    </div>
  );
}
