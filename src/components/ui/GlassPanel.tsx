"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Stronger blur + opacity for foreground surfaces (windows, palettes). */
  strong?: boolean;
  /** Adds a soft accent glow ring. */
  glow?: boolean;
}

/**
 * The foundational frosted-glass surface used across NEXUS.
 * Reused by windows, dock, taskbar, dialogs and widgets.
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, strong, glow, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          strong ? "glass-strong" : "glass",
          "rounded-3xl shadow-glass",
          glow && "ring-accent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";
