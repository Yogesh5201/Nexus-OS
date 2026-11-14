"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarfieldProps {
  count: number;
}

/**
 * A deep field of twinkling stars distributed on a large sphere shell.
 * Uses a single Points object + additive blending for cheap, glowing stars.
 */
export function Starfield({ count }: StarfieldProps) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#bcd4ff"),
      new THREE.Color("#cabffd"),
      new THREE.Color("#9be4ff"),
    ];

    for (let i = 0; i < count; i++) {
      // Distribute on a spherical shell. Keep the radius range tighter so
      // points stay larger than a pixel on screen (avoids scintillation).
      const r = 40 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 1.4 + 1.0;
    }
    return { positions, colors, sizes };
  }, [count]);

  // Slow rotation gives a subtle sense of cosmic drift.
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.008;
      ref.current.rotation.x += delta * 0.002;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      {/* Constant screen-space size (no attenuation) keeps every star a stable
          pixel size as the field rotates — this is what eliminates the
          sub-pixel "twinkle"/flicker. */}
      <pointsMaterial
        vertexColors
        size={2}
        sizeAttenuation={false}
        transparent
        opacity={0.95}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
