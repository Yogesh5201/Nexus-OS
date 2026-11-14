"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

/** Lightweight tooltip wrapper used by the dock & toolbar icons. */
export function Tooltip({ content, children, side = "top", sideOffset = 8 }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-[9999] rounded-lg glass-strong px-2.5 py-1.5 text-xs font-medium text-text shadow-float",
              "data-[state=delayed-open]:animate-scale-in"
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-glass" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
