"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GalaxyProps {
  count: number;
}

/**
 * A procedurally-generated spiral galaxy of particles, tinted from the
 * core colour to the accent colour at its arms. Rotates slowly and is
 * tilted to sit dramatically in the lower portion of the scene.
 */
export function Galaxy({ count }: GalaxyProps) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const branches = 5;
    const radiusMax = 22;
    const spin = 1.1;
    const randomness = 0.45;
    const randomnessPower = 2.6;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const inside = new THREE.Color("#fff4d6"); // warm core
    const outside = new THREE.Color("#5b8cff"); // cool arms

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 1.5) * radiusMax;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = radius * spin;

      const rand = () =>
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        radius;

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rand();
      positions[i3 + 1] = rand() * 0.55; // flatten the disk
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rand();

      const mixed = inside.clone().lerp(outside, radius / radiusMax);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
  });

  if (count === 0) return null;

  return (
    <points ref={ref} position={[14, -10, -28]} rotation={[Math.PI / 3.2, 0, 0.3]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
