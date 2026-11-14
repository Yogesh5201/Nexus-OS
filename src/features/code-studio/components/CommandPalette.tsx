"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Command } from "../types";

/** Editor-scoped command palette (Ctrl/⌘+Shift+P). Distinct from the OS ⌘K. */
export default function CommandPalette({
  commands,
  open,
  onClose,
}: {
  commands: Command[];
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      // Focus after the enter animation begins.
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  const runAt = (i: number) => {
    const cmd = results[i];
    if (cmd) {
      onClose();
      // Defer so the palette unmounts before the command mutates focus.
      setTimeout(() => cmd.run(), 0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Keep the selected row in view.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [index]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-30 flex items-start justify-center bg-black/40 pt-[12%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="glass-strong w-[520px] max-w-[90%] overflow-hidden rounded-xl shadow-float"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border/10 px-3 py-2.5">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command…"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-muted/60 focus:outline-none"
              />
            </div>
            <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted/60">
                  No matching commands
                </p>
              ) : (
                results.map((c, i) => (
                  <button
                    key={c.id}
                    data-idx={i}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => runAt(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors",
                      i === index ? "bg-accent/15 text-text" : "text-muted"
                    )}
                  >
                    <span className="w-14 shrink-0 text-[10.5px] uppercase tracking-wide text-muted/60">
                      {c.group}
                    </span>
                    <span className="flex-1 truncate">{c.title}</span>
                    {c.keybinding && (
                      <kbd className="shrink-0 rounded border border-border/15 bg-glass/50 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        {c.keybinding}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
