"use client";

import { motion } from "framer-motion";
import { useWindowStore, snapRect } from "@/store/useWindowStore";

/** Translucent accent preview showing where a dragged window will snap. */
export function SnapOverlay() {
  const snapPreview = useWindowStore((s) => s.snapPreview);
  if (!snapPreview) return null;

  const rect = snapRect(snapPreview);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute z-[1] rounded-2xl border-2 border-accent/60 bg-accent/10 backdrop-blur-sm shadow-glow"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    />
  );
}
