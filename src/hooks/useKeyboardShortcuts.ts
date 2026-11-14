"use client";

import { useEffect } from "react";

export interface Shortcut {
  /** Lowercase key, e.g. "k", "arrowleft". */
  key: string;
  meta?: boolean; // Cmd / Ctrl
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  /** Allow firing even when an input/textarea is focused. */
  allowInInput?: boolean;
}

/** Register global keyboard shortcuts for the OS shell. */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      for (const s of shortcuts) {
        const metaMatch = s.meta ? e.metaKey || e.ctrlKey : !(e.metaKey || e.ctrlKey);
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;
        if (
          e.key.toLowerCase() === s.key &&
          metaMatch &&
          shiftMatch &&
          altMatch &&
          (s.allowInInput || !inInput)
        ) {
          s.handler(e);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
