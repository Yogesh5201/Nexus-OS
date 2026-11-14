"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWindowStore } from "@/store/useWindowStore";
import { formatClock } from "@/lib/utils";
import { getGreeting } from "@/lib/userProfile";

/** Soft shadow that keeps text legible over the animated galaxy background. */
const TEXT_SHADOW = "0 4px 18px rgba(0,0,0,.45)";

/**
 * Ambient desktop widget shown when no windows obscure it: a large clock, a
 * personalised time-of-day greeting and a one-tap entry into the AI assistant.
 *
 * The greeting sits inside a subtle glass panel with a radial darken behind it
 * so it stays readable over the moving 3D wallpaper (the animation is untouched).
 */
export function Widgets() {
  const now = useClock();
  const { displayName } = useUserProfile();
  const open = useWindowStore((s) => s.open);
  const hasWindows = useWindowStore((s) => s.windows.some((w) => w.state !== "minimized"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: hasWindows ? 0 : 1, y: hasWindows ? 10 : 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-[58%] text-center"
    >
      <div className="relative inline-flex flex-col items-center">
        {/* Radial darken — only behind the greeting, keeps the wallpaper visible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[160%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(2,6,23,.55) 0%, rgba(2,6,23,.3) 42%, rgba(2,6,23,0) 72%)",
          }}
        />

        {/* Glass greeting card */}
        <div
          className="rounded-[18px]"
          style={{
            background: "rgba(15,23,42,.18)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,.08)",
            padding: "18px 26px",
          }}
        >
          {/* Time — 64–72px */}
          <div
            className="text-[64px] font-bold leading-none tracking-tight text-text sm:text-7xl"
            style={{ textShadow: TEXT_SHADOW }}
          >
            {formatClock(now)}
          </div>

          {/* Greeting line — 22px */}
          <div
            className="mt-4 text-[22px] font-medium text-text/85"
            style={{ textShadow: TEXT_SHADOW }}
          >
            {getGreeting(now.getHours())},
          </div>

          {/* Name — 34–40px, weight 700, stands out immediately */}
          <div
            className="mt-1 text-[36px] font-bold leading-tight text-text"
            style={{ textShadow: TEXT_SHADOW }}
          >
            {displayName}
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={() => open("ai-assistant")}
          className="glass pointer-events-auto mx-auto mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-text transition-all hover:shadow-glow"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          Ask NEXUS anything
          <ArrowRight className="h-4 w-4 text-muted" />
        </button>
      </div>
    </motion.div>
  );
}
