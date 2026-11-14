"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/store/useWindowStore";
import { Window } from "./Window";
import { SnapOverlay } from "./SnapOverlay";

/**
 * Renders all live (non-minimized) windows above the desktop and below the
 * shell chrome. The container is pointer-transparent so the desktop behind
 * stays interactive; each window re-enables pointer events for itself.
 */
export function WindowManager() {
  const windows = useWindowStore((s) => s.windows);

  return (
    <div className="pointer-events-none absolute inset-0">
      <SnapOverlay />
      <AnimatePresence>
        {windows
          .filter((w) => w.state !== "minimized")
          .map((win) => (
            <Window key={win.id} win={win} />
          ))}
      </AnimatePresence>
    </div>
  );
}
