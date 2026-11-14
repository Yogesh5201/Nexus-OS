"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetProps {
  /** Accent colour as an "R G B" (0-255) triplet string from settings. */
  accent: string;
  position?: [number, number, number];
}

/** Parse an "R G B" triplet into a normalized THREE.Color. */
function tripletToColor(triplet: string): THREE.Color {
  const [r, g, b] = triplet.split(/\s+/).map((n) => parseInt(n, 10) / 255);
  return new THREE.Color(r || 0.3, g || 0.7, b || 1);
}

/**
 * A stylised floating planet: a shaded sphere wrapped in a Fresnel
 * atmosphere shell that glows in the user's accent colour.
 */
export function Planet({ accent, position = [-13, 6, -18] }: PlanetProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const accentColor = useMemo(() => tripletToColor(accent), [accent]);

  // Custom additive Fresnel material for the atmospheric rim glow.
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: accentColor },
        // Stronger rim glow to recreate the bloom halo without post-processing.
        uIntensity: { value: 1.85 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
          gl_FragColor = vec4(uColor, fresnel * uIntensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [accentColor]);

  useFrame((state, delta) => {
    if (core.current) core.current.rotation.y += delta * 0.05;
    if (group.current) {
      // Gentle floating bob.
      group.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.5;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Planet body */}
      <mesh ref={core}>
        <icosahedronGeometry args={[4, 12]} />
        <meshStandardMaterial
          color="#0e1830"
          emissive={accentColor}
          emissiveIntensity={0.12}
          roughness={0.65}
          metalness={0.35}
          flatShading={false}
        />
      </mesh>

      {/* Atmosphere glow shell */}
      <mesh scale={1.18}>
        <icosahedronGeometry args={[4, 12]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Orbital ring for a sci-fi accent. Tube kept thick enough to always
          cover several pixels — a sub-pixel-thin ring aliases and flickers. */}
      <mesh rotation={[Math.PI / 2.3, 0.4, 0]}>
        <torusGeometry args={[6.2, 0.12, 16, 160]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
