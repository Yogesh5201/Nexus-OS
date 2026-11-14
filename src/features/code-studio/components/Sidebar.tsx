"use client";

import { Play, RotateCcw, Search, Sparkles, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCodeStudioStore } from "../store/useCodeStudioStore";
import Explorer from "./explorer/Explorer";

/** Sidebar content, chosen by the active activity-bar view. */
export default function Sidebar() {
  const view = useCodeStudioStore((s) => s.sidebarView);
  switch (view) {
    case "explorer":
      return <Explorer />;
    case "run":
      return <RunView />;
    case "search":
      return (
        <Placeholder
          icon={Search}
          title="Search"
          body="Workspace-wide search & replace with regex is coming in a later phase."
        />
      );
    case "ai":
      return (
        <Placeholder
          icon={Sparkles}
          title="AI Assistant"
          body="Explain, refactor, generate and fix code inline — arriving in Phase 3."
        />
      );
    case "settings":
      return (
        <Placeholder
          icon={Settings2}
          title="Editor Settings"
          body="Fonts, themes, keybindings and more get a full panel in a later phase."
        />
      );
    default:
      return <Explorer />;
  }
}

function RunView() {
  const prefs = useCodeStudioStore((s) => s.prefs);
  const setPref = useCodeStudioStore((s) => s.setPref);
  const resetWorkspace = useCodeStudioStore((s) => s.resetWorkspace);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted/80">
        Run &amp; Preview
      </span>
      <button
        onClick={() => window.dispatchEvent(new Event("nexus:cs-run"))}
        className="accent-gradient flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-black/80"
      >
        <Play className="h-3.5 w-3.5" /> Run / Refresh
      </button>
      <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-border/10 bg-glass/30 px-3 py-2 text-xs text-muted">
        Auto-run on change
        <input
          type="checkbox"
          checked={prefs.autoRun}
          onChange={(e) => setPref("autoRun", e.target.checked)}
          className="h-3.5 w-3.5 accent-[rgb(var(--accent))]"
        />
      </label>
      <button
        onClick={resetWorkspace}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-border/10 px-3 py-2 text-xs text-muted transition-colors hover:text-danger"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset workspace
      </button>
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-glass/50">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted/70">{body}</p>
      </div>
    </div>
  );
}
