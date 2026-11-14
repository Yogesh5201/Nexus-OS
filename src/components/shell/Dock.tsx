"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { DOCK_APPS, APP_REGISTRY } from "@/constants/apps";
import { useWindowStore } from "@/store/useWindowStore";
import { Tooltip } from "@/components/ui/Tooltip";
import type { AppId } from "@/types/app";
import { cn } from "@/lib/utils";

/** A single magnifying dock icon that scales based on cursor proximity. */
function DockIcon({ appId, mouseX }: { appId: AppId; mouseX: MotionValue<number> }) {
  const def = APP_REGISTRY[appId];
  const ref = useRef<HTMLButtonElement>(null);
  const open = useWindowStore((s) => s.open);
  const isRunning = useWindowStore((s) => s.windows.some((w) => w.appId === appId));

  // Distance from the cursor to this icon's centre.
  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return x - bounds.x - bounds.width / 2;
  });

  // Map distance → size with a soft falloff, then smooth with a spring.
  const sizeRaw = useTransform(distance, [-140, 0, 140], [48, 74, 48]);
  const size = useSpring(sizeRaw, { stiffness: 350, damping: 22, mass: 0.4 });

  const Icon = def.icon;

  return (
    <Tooltip content={def.name}>
      <motion.button
        ref={ref}
        style={{ width: size, height: size }}
        onClick={() => open(appId)}
        aria-label={`Open ${def.name}`}
        className="group relative flex items-center justify-center"
      >
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br shadow-glass transition-shadow",
            "group-hover:shadow-glow",
            def.accent
          )}
        >
          <Icon className="h-1/2 w-1/2 text-black/80" strokeWidth={2} />
        </span>
        {/* Running indicator */}
        <span
          className={cn(
            "absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-text transition-opacity",
            isRunning ? "opacity-90" : "opacity-0"
          )}
        />
      </motion.button>
    </Tooltip>
  );
}

/** The bottom dock — a magnifying, glassy app launcher. */
export function Dock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="glass-strong pointer-events-auto flex items-end gap-3 rounded-3xl px-4 pb-3 pt-3 shadow-float"
      >
        {DOCK_APPS.map((appId) => (
          <DockIcon key={appId} appId={appId} mouseX={mouseX} />
        ))}
      </motion.div>
    </div>
  );
}
