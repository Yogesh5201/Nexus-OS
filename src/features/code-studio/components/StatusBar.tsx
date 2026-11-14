"use client";

import { useEffect, useState } from "react";
import { Check, Circle, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../store/useCodeStudioStore";
import { languageDisplay } from "../data/languages";

/** Bottom status bar: run state, language, cursor position, indent, encoding. */
export default function StatusBar() {
  const activeTabId = useCodeStudioStore((s) => s.activeTabId);
  const node = useCodeStudioStore((s) => s.getNode(activeTabId));
  const cursor = useCodeStudioStore((s) => s.cursor);
  const runState = useCodeStudioStore((s) => s.runState);
  const wordWrap = useCodeStudioStore((s) => s.prefs.wordWrap);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onSaved = () => {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1600);
      return () => clearTimeout(t);
    };
    window.addEventListener("nexus:cs-saved", onSaved);
    return () => window.removeEventListener("nexus:cs-saved", onSaved);
  }, []);

  return (
    <div className="flex h-6 shrink-0 items-center gap-3 border-t border-border/10 bg-surface/60 px-3 text-[10.5px] text-muted">
      {/* Left: run state */}
      <span className="flex items-center gap-1.5">
        {runState === "running" ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-accent" /> Running
          </>
        ) : runState === "error" ? (
          <>
            <TriangleAlert className="h-3 w-3 text-danger" /> Error
          </>
        ) : (
          <>
            <Circle className="h-2 w-2 fill-success text-success" /> Ready
          </>
        )}
      </span>

      {saved && (
        <span className="flex items-center gap-1 text-success">
          <Check className="h-3 w-3" /> Saved
        </span>
      )}

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-3">
        {node && (
          <>
            <span>
              Ln {cursor.line}, Col {cursor.column}
              {cursor.selected > 0 && ` (${cursor.selected} sel)`}
            </span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span className={cn(wordWrap && "text-accent")}>
              {wordWrap ? "Wrap" : "No Wrap"}
            </span>
            <span className="font-medium text-text/80">{languageDisplay(node.name)}</span>
          </>
        )}
      </div>
    </div>
  );
}
