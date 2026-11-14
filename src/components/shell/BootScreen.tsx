"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "Initializing NEXUS kernel…",
  "Mounting virtual filesystem…",
  "Calibrating 3D environment…",
  "Linking AI core…",
  "Welcome, Operator.",
];

/**
 * Cinematic GSAP boot sequence shown on first paint. Animates the wordmark,
 * a progress bar and streaming status lines, then calls onComplete().
 */
export function BootScreen({ onComplete }: BootScreenProps) {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete,
      });

      tl.from(logo.current, { opacity: 0, scale: 0.8, filter: "blur(20px)", duration: 1 })
        .from(
          logo.current?.querySelectorAll(".boot-letter") ?? [],
          { y: 40, opacity: 0, stagger: 0.06, duration: 0.6 },
          "-=0.6"
        )
        .from(
          lines.current?.children ?? [],
          { opacity: 0, x: -12, stagger: 0.22, duration: 0.4 },
          "-=0.2"
        )
        .to(bar.current, { width: "100%", duration: 1.6, ease: "power2.inOut" }, "-=1.2")
        .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.in" }, "+=0.2")
        .set(root.current, { pointerEvents: "none" });
    }, root);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#04050c]"
    >
      {/* subtle animated radial backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_60%_at_50%_40%,rgb(var(--accent)/0.16),transparent_70%)]" />

      <div ref={logo} className="relative mb-10 text-center">
        <h1 className="flex text-6xl font-bold tracking-[0.3em] sm:text-8xl">
          {"NEXUS".split("").map((c, i) => (
            <span key={i} className="boot-letter text-gradient">
              {c}
            </span>
          ))}
        </h1>
        <p className="mt-3 text-xs font-medium tracking-[0.5em] text-muted">
          AI OPERATING SYSTEM
        </p>
      </div>

      <div className="relative h-1 w-64 overflow-hidden rounded-full bg-glass/60">
        <div ref={bar} className="accent-gradient h-full w-0 rounded-full shadow-glow" />
      </div>

      <div
        ref={lines}
        className="mt-8 h-20 w-72 space-y-1.5 text-center font-mono text-[11px] text-muted/80"
      >
        {BOOT_LINES.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}
