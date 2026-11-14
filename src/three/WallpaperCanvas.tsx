"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getAccent } from "@/constants/accents";
import { getQuality } from "./quality";
import { Starfield } from "./Starfield";
import { Galaxy } from "./Galaxy";
import { Nebula } from "./Nebula";
import { Planet } from "./Planet";
import { FloatingParticles } from "./FloatingParticles";
import { CameraRig } from "./CameraRig";

/**
 * The animated 3D space wallpaper that lives behind the entire OS.
 *
 * Anti-flicker design notes (why this is structured the way it is):
 *  - NO WebGL post-processing (EffectComposer/Bloom). That render path
 *    flickers on some integrated GPUs — notably AMD Radeon (RDNA) via ANGLE.
 *    The "glow" is instead produced by additive blending in the scene plus a
 *    CSS vignette overlay, which is rock-steady on every GPU.
 *  - The canvas sits in its OWN compositor layer (translateZ/backface-hidden)
 *    at a POSITIVE z-index. Negative z-index behind framer-motion's
 *    transformed UI layers caused the Windows compositor to tear every frame.
 *  - `gl`, `camera` and `dpr` are memoised so the Canvas never re-initialises,
 *    and DPR is a fixed number so the drawing buffer is never resized.
 *  - All additive/transparent layers disable depthTest to avoid sort flips.
 */
export function WallpaperCanvas() {
  const performance = useSettingsStore((s) => s.performance);
  const accentId = useSettingsStore((s) => s.accentId);
  const wallpaperEnabled = useSettingsStore((s) => s.wallpaperEnabled);

  const quality = getQuality(performance);
  const accent = getAccent(accentId).accent;

  // Fixed device-pixel-ratio: capped so the buffer size is stable all session.
  const dpr = useMemo(() => {
    const device = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const cap = performance === "battery" ? 1 : performance === "balanced" ? 1.5 : 2;
    return Math.min(device, cap);
  }, [performance]);

  // Stable GL + camera config (identity never changes across renders).
  const glConfig = useMemo(
    () => ({
      antialias: true,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: "high-performance" as const,
      preserveDrawingBuffer: false,
    }),
    []
  );
  const cameraConfig = useMemo(
    () => ({ position: [0, 1, 16] as [number, number, number], fov: 60, near: 0.1, far: 1000 }),
    []
  );

  // Dedicated GPU compositor layer for the canvas — the key fix for tearing
  // against the blurred glass UI painted above it.
  const layerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    willChange: "transform",
  };

  // Static premium gradient when the 3D wallpaper is turned off.
  if (!wallpaperEnabled) {
    return (
      <div
        style={{
          ...layerStyle,
          background:
            "radial-gradient(120% 120% at 20% 10%, rgb(var(--accent) / 0.18), transparent 45%), radial-gradient(120% 120% at 85% 90%, rgb(var(--accent-2) / 0.16), transparent 50%), rgb(var(--bg))",
        }}
      />
    );
  }

  return (
    <div style={layerStyle}>
      <Canvas
        dpr={dpr}
        gl={glConfig}
        camera={cameraConfig}
        frameloop="always"
        onCreated={({ gl }) => {
          // Explicit, deterministic clearing each frame.
          gl.setClearColor(new THREE.Color("#04050c"), 1);
          gl.autoClear = true;
        }}
      >
        <color attach="background" args={["#04050c"]} />
        <fog attach="fog" args={["#04050c", 30, 130]} />

        {/* Lighting for the shaded planet */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[-10, 8, 6]} intensity={1.4} color="#cfe2ff" />
        <pointLight position={[10, -6, -10]} intensity={40} color="#7c5bff" distance={60} />

        <Suspense fallback={null}>
          {quality.nebula && <Nebula />}
          <Starfield count={quality.stars} />
          <Galaxy count={quality.galaxyParticles} />
          <Planet accent={accent} />
          <FloatingParticles />
        </Suspense>

        <CameraRig />
      </Canvas>

      {/* CSS "post-processing": a soft vignette + accent glow painted over the
          canvas. Replaces the WebGL Vignette/Bloom with zero GPU flicker risk. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(75% 60% at 18% 12%, rgb(var(--accent) / 0.10), transparent 60%)," +
            "radial-gradient(70% 60% at 85% 90%, rgb(var(--accent-2) / 0.10), transparent 60%)," +
            "radial-gradient(120% 100% at 50% 45%, transparent 52%, rgba(2,3,8,0.55) 100%)",
        }}
      />
    </div>
  );
}
