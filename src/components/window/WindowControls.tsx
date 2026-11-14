"use client";

import { Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WindowControlsProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

/** macOS-style traffic-light controls with hover glyphs. */
export function WindowControls({ onMinimize, onMaximize, onClose }: WindowControlsProps) {
  const dot =
    "group/dot flex h-3.5 w-3.5 items-center justify-center rounded-full transition-transform hover:scale-110";
  const glyph = "h-2 w-2 opacity-0 transition-opacity group-hover/dot:opacity-100";

  return (
    <div className="group flex items-center gap-2">
      <button
        aria-label="Close"
        onClick={onClose}
        className={cn(dot, "bg-[#ff5f57]")}
      >
        <X className={cn(glyph, "text-black/70")} strokeWidth={3} />
      </button>
      <button
        aria-label="Minimize"
        onClick={onMinimize}
        className={cn(dot, "bg-[#febc2e]")}
      >
        <Minus className={cn(glyph, "text-black/70")} strokeWidth={3} />
      </button>
      <button
        aria-label="Maximize"
        onClick={onMaximize}
        className={cn(dot, "bg-[#28c840]")}
      >
        <Square className={cn(glyph, "text-black/70")} strokeWidth={3} />
      </button>
    </div>
  );
}
