import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface PhoenixCoreSceneProps {
  /** Freezes autonomous motion for prefers-reduced-motion; the scene still renders statically. */
  reducedMotion?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// The energy core: an organic, shader-distorted icosahedron standing in for
// the phoenix identity — a living light source rather than a static image.
// ---------------------------------------------------------------------------
const EnergyCore: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.18;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.12;
      wireRef.current.rotation.z += delta * 0.06;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.15, 4]} />
        <MeshDistortMaterial
          color="#22d3ee"
          emissive="#0891b2"
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.3}
          distort={0.45}
          speed={reducedMotion ? 0 : 1.6}
        />
      </mesh>
      {/* Faint violet wireframe shell orbiting the core at a different rate,
          reading as an energy containment field. */}
      <mesh ref={wireRef} scale={1.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Orbiting shards — small geometric fragments circling the core on three
// independent rings, evoking debris/energy caught in the phoenix's pull.
// ---------------------------------------------------------------------------
interface ShardRingProps {
  radius: number;
  count: number;
  speed: number;
  tilt: number;
  color: string;
  size: number;
  reducedMotion: boolean;
}

const ShardRing: React.FC<ShardRingProps> = ({ radius, count, speed, tilt, color, size, reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        spinSpeed: 0.6 + Math.random() * 0.8,
      })),
    [count]
  );

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      {shards.map((shard, i) => (
        <mesh
          key={i}
          position={[Math.cos(shard.angle) * radius, 0, Math.sin(shard.angle) * radius]}
        >
          <octahedronGeometry args={[size, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// A soft field of drifting light points behind everything, giving the scene
// real volumetric depth instead of a flat backdrop.
// ---------------------------------------------------------------------------
const ParticleField: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 180;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 3.2 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.025;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#67e8f9"
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// ---------------------------------------------------------------------------
// Rig: camera parallax that reacts to the pointer, layered on top of the
// scene's own slow autonomous drift — cause-and-effect, not just ambience.
// ---------------------------------------------------------------------------
const SceneRig: React.FC<{ reducedMotion: boolean; children: React.ReactNode }> = ({ reducedMotion, children }) => {
  const rigRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!rigRef.current) return;
    if (reducedMotion) {
      rigRef.current.rotation.set(0, 0, 0);
      return;
    }
    const autonomous = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
    const targetY = pointer.x * 0.55 + autonomous;
    const targetX = -pointer.y * 0.35;
    rigRef.current.rotation.y += (targetY - rigRef.current.rotation.y) * 0.06;
    rigRef.current.rotation.x += (targetX - rigRef.current.rotation.x) * 0.06;
  });

  return <group ref={rigRef}>{children}</group>;
};

/**
 * The 3D hero scene: replaces the static phoenix PNG with a live WebGL
 * energy-core environment. Autonomous drift keeps it alive at rest; pointer
 * movement drives real camera parallax on top of that drift.
 */
export const PhoenixCoreScene: React.FC<PhoenixCoreSceneProps> = ({ reducedMotion = false, className = '' }) => {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5.6], fov: 42 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[3, 2, 4]} intensity={40} color="#22d3ee" distance={12} />
        <pointLight position={[-3, -2, -3]} intensity={30} color="#a855f7" distance={12} />
        <pointLight position={[0, 3, -2]} intensity={20} color="#ec4899" distance={10} />

        <SceneRig reducedMotion={reducedMotion}>
          <Float speed={reducedMotion ? 0 : 1.1} rotationIntensity={reducedMotion ? 0 : 0.15} floatIntensity={reducedMotion ? 0 : 0.5}>
            <EnergyCore reducedMotion={reducedMotion} />
          </Float>
          <ShardRing radius={2.05} count={6} speed={0.22} tilt={0.35} color="#22d3ee" size={0.09} reducedMotion={reducedMotion} />
          <ShardRing radius={2.55} count={5} speed={-0.16} tilt={-0.5} color="#a855f7" size={0.075} reducedMotion={reducedMotion} />
          <ShardRing radius={1.65} count={4} speed={0.3} tilt={1.15} color="#ec4899" size={0.06} reducedMotion={reducedMotion} />
          <ParticleField reducedMotion={reducedMotion} />
        </SceneRig>
      </Canvas>
    </div>
  );
};
