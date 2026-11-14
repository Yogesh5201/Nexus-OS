"use client";

import { Loader2 } from "lucide-react";

/** Shown while a lazily-loaded app bundle is being fetched. */
export function AppSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
        <Loader2 className="relative h-8 w-8 animate-spin text-accent" />
      </div>
      <p className="text-xs font-medium tracking-wide text-muted/80">Loading module…</p>
    </div>
  );
}
