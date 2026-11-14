"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search, Sparkles } from "lucide-react";
import { ALL_APPS } from "@/constants/apps";
import { useUIStore } from "@/store/useUIStore";
import { useWindowStore } from "@/store/useWindowStore";
import type { AppId } from "@/types/app";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

/** Raycast-style command palette: fuzzy-search apps & actions, ⌘K to open. */
export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const open = useWindowStore((s) => s.open);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build the command list from the app registry (+ a quick AI action).
  const commands = useMemo<Command[]>(() => {
    const appCommands: Command[] = ALL_APPS.map((app) => ({
      id: `open-${app.id}`,
      label: `Open ${app.name}`,
      hint: app.description,
      icon: app.icon,
      run: () => open(app.id as AppId),
    }));
    return appCommands;
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Whether to show the "Ask AI" affordance for free-text queries.
  const showAsk = query.trim().length > 0;

  // Reset + focus when opened.
  useEffect(() => {
    if (commandOpen) {
      setQuery("");
      setActive(0);
      // Focus after the enter animation frame.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [commandOpen]);

  const total = filtered.length + (showAsk ? 1 : 0);

  const execute = (index: number) => {
    if (showAsk && index === filtered.length) {
      open("ai-assistant");
      // Hand the query off to the assistant via a custom event.
      window.dispatchEvent(new CustomEvent("nexus:ask-ai", { detail: query }));
    } else {
      filtered[index]?.run();
    }
    setCommandOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(total, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + total) % Math.max(total, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(active);
    } else if (e.key === "Escape") {
      setCommandOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {commandOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="glass-strong relative z-10 w-[92%] max-w-xl overflow-hidden rounded-2xl shadow-float"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border/10 px-4 py-3.5">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search apps, actions, or ask AI…"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-muted/70 focus:outline-none"
              />
              <kbd className="rounded bg-glass/80 px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2 no-scrollbar">
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => execute(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active === i ? "bg-accent/15" : "hover:bg-glass/50"
                  )}
                >
                  <cmd.icon className="h-4 w-4 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-text">{cmd.label}</div>
                    <div className="truncate text-xs text-muted">{cmd.hint}</div>
                  </div>
                  {active === i && <CornerDownLeft className="h-3.5 w-3.5 text-muted" />}
                </button>
              ))}

              {showAsk && (
                <button
                  onMouseEnter={() => setActive(filtered.length)}
                  onClick={() => execute(filtered.length)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active === filtered.length ? "bg-accent/15" : "hover:bg-glass/50"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-text">Ask NEXUS AI</div>
                    <div className="truncate text-xs text-muted">&ldquo;{query}&rdquo;</div>
                  </div>
                </button>
              )}

              {total === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted">No results found</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
