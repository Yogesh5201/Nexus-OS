"use client";

import { Eye, Play, RefreshCw } from "lucide-react";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import { htmlEntry } from "./buildSrcDoc";
import WebPreview from "./WebPreview";
import Viewer, { viewKind, viewLabel } from "./Viewer";

/**
 * Right-hand preview pane. Chooses what to show, in priority order:
 *   1. A rich viewer for the active file (Markdown / JSON / CSV / Image)
 *   2. The live web preview when the project has an index.html
 *   3. A placeholder prompting the user to run or add web files
 */
export default function PreviewPanel() {
  const activeTabId = useCodeStudioStore((s) => s.activeTabId);
  const active = useCodeStudioStore((s) => s.getNode(activeTabId));
  const nodes = useCodeStudioStore((s) => s.nodes);
  const autoRun = useCodeStudioStore((s) => s.prefs.autoRun);
  const setPref = useCodeStudioStore((s) => s.setPref);

  const kind = active ? viewKind(active.name) : null;
  const hasWeb = htmlEntry(nodes) !== null;
  const mode: "viewer" | "web" | "none" = kind ? "viewer" : hasWeb ? "web" : "none";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-surface/40">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/10 px-3 py-1.5">
        <Eye className="h-3.5 w-3.5 text-muted" />
        <span className="text-[11px] font-medium text-muted">
          {mode === "viewer" && active ? `${viewLabel(active.name)} Preview` : "Preview"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {mode === "web" && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[10.5px] text-muted hover:text-text">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setPref("autoRun", e.target.checked)}
                className="h-3 w-3 accent-[rgb(var(--accent))]"
              />
              Auto
            </label>
          )}
          <button
            onClick={() => window.dispatchEvent(new Event("nexus:cs-run"))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-glass/60 hover:text-text"
            aria-label="Run / refresh"
            title="Run / refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {mode === "viewer" && active ? (
          <Viewer node={active} />
        ) : mode === "web" ? (
          <WebPreview />
        ) : (
          <NoPreview />
        )}
      </div>
    </div>
  );
}

function NoPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-glass/50">
        <Play className="h-5 w-5 text-muted" />
      </div>
      <p className="max-w-[240px] text-xs text-muted">
        Open a <code className="text-accent">.py</code>,{" "}
        <code className="text-accent">.js</code> or{" "}
        <code className="text-accent">.ts</code> file and press{" "}
        <kbd className="rounded border border-border/15 bg-glass/50 px-1 text-[10px]">
          Ctrl+Enter
        </kbd>{" "}
        to run it, or add an <code className="text-accent">index.html</code> for a
        live web preview.
      </p>
    </div>
  );
}
