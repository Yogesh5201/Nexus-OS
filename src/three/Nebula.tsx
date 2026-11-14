"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A single soft, glowing nebula cloud rendered as a shader plane. */
function Cloud({
  color,
  position,
  scale,
  speed,
}: {
  color: string;
  position: [number, number, number];
  scale: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;
          // Soft radial falloff with subtle animated turbulence.
          void main() {
            vec2 c = vUv - 0.5;
            float d = length(c);
            float turb = 0.05 * sin(vUv.x * 8.0 + uTime) * cos(vUv.y * 6.0 - uTime * 0.7);
            float alpha = smoothstep(0.5, 0.0, d + turb);
            gl_FragColor = vec4(uColor, alpha * 0.42);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false, // huge background planes must never z-fight the rest
      }),
    [color]
  );

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime * speed;
    if (ref.current) ref.current.rotation.z += delta * 0.01 * speed;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/** Layered nebula clouds drifting deep in the background. */
export function Nebula() {
  return (
    <group position={[0, 0, -40]}>
      <Cloud color="#5b3bff" position={[-18, 6, 0]} scale={42} speed={0.5} />
      <Cloud color="#1f6dff" position={[16, -4, -6]} scale={50} speed={0.35} />
      <Cloud color="#c026d3" position={[4, 12, -10]} scale={36} speed={0.6} />
    </group>
  );
}
