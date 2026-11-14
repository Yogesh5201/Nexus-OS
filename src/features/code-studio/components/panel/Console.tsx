"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import type { LogLevel } from "../../types";

const LEVEL_STYLE: Record<LogLevel, string> = {
  log: "text-text/80",
  info: "text-accent",
  debug: "text-muted",
  warn: "text-warning",
  error: "text-danger",
};

const LEVEL_GLYPH: Record<LogLevel, string> = {
  log: "›",
  info: "ℹ",
  debug: "·",
  warn: "⚠",
  error: "⛔",
};

/** Console output captured from the live preview (same bridge protocol). */
export default function Console() {
  const logs = useCodeStudioStore((s) => s.consoleLogs);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="px-3 py-2 font-mono text-[11.5px] text-muted/50">
        // console output appears here
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 font-mono text-[11.5px] leading-relaxed">
      {logs.map((l) => (
        <div
          key={l.id}
          className={cn("flex gap-2 whitespace-pre-wrap break-words", LEVEL_STYLE[l.level])}
        >
          <span className="select-none opacity-70">{LEVEL_GLYPH[l.level]}</span>
          <span className="min-w-0 flex-1">{l.text}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
