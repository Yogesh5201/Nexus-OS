"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Inline rename field — autofocuses and selects the base name (sans extension). */
export function RenameInput({
  initial,
  isFolder,
  className,
  onCommit,
  onCancel,
}: {
  initial: string;
  isFolder: boolean;
  className?: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf(".");
    if (!isFolder && dot > 0) el.setSelectionRange(0, dot);
    else el.select();
  }, [initial, isFolder]);

  return (
    <input
      ref={ref}
      defaultValue={initial}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onCommit((e.target as HTMLInputElement).value);
        else if (e.key === "Escape") onCancel();
      }}
      onBlur={(e) => onCommit(e.target.value)}
      className={cn(
        "rounded border border-accent/60 bg-surface px-1 text-text outline-none",
        className
      )}
    />
  );
}
