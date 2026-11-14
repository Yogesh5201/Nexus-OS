"use client";

import { useEffect } from "react";
import type { Command } from "../types";

/** Build a normalized combo string (Ctrl→Shift→Alt→Key) from a keydown event. */
function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join("+");
}

/**
 * Bind Code Studio's keyboard shortcuts, scoped to the given container element
 * so they never collide with OS-level shortcuts (e.g. the ⌘K command palette).
 * Uses the capture phase so combos resolve before Monaco's own key handling.
 */
export function useCodeStudioHotkeys(
  ref: React.RefObject<HTMLElement>,
  commands: Command[]
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const byCombo = new Map<string, Command>();
    for (const c of commands) if (c.keybinding) byCombo.set(c.keybinding, c);

    const onKeyDown = (e: KeyboardEvent) => {
      const cmd = byCombo.get(comboFromEvent(e));
      if (!cmd) return;
      e.preventDefault();
      e.stopPropagation();
      cmd.run();
    };

    el.addEventListener("keydown", onKeyDown, { capture: true });
    return () => el.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [ref, commands]);
}
