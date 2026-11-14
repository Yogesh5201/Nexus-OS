"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-border/10 bg-glass/40 px-3.5 text-sm text-text",
        "placeholder:text-muted/70 transition-all duration-200",
        "focus:border-accent/50 focus:bg-glass/60 focus:outline-none focus:ring-2 focus:ring-accent/30",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border/10 bg-glass/40 px-3.5 py-2.5 text-sm text-text",
        "placeholder:text-muted/70 transition-all duration-200 resize-none",
        "focus:border-accent/50 focus:bg-glass/60 focus:outline-none focus:ring-2 focus:ring-accent/30",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
