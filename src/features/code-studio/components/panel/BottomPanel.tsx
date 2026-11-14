"use client";

import { useEffect, useState } from "react";
import { useMonaco } from "@monaco-editor/react";
import { AlertCircle, Ban, ChevronDown, Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import type { PanelTab } from "../../types";
import Console from "./Console";

/** A Monaco diagnostic, flattened for the Problems list. */
interface Problem {
  key: string;
  severity: number; // 8=error, 4=warning, 2=info, 1=hint
  message: string;
  resource: string;
  line: number;
  column: number;
}

/**
 * Bottom panel: Console / Problems / Output tabs. Problems mirrors live Monaco
 * diagnostics across all open models; Console renders captured preview output.
 */
export default function BottomPanel() {
  const panelTab = useCodeStudioStore((s) => s.panelTab);
  const setPanelTab = useCodeStudioStore((s) => s.setPanelTab);
  const setPanelOpen = useCodeStudioStore((s) => s.setPanelOpen);
  const clearLogs = useCodeStudioStore((s) => s.clearLogs);
  const logCount = useCodeStudioStore((s) => s.consoleLogs.length);
  const problems = useMonacoProblems();

  const errorCount = problems.filter((p) => p.severity === 8).length;
  const warnCount = problems.filter((p) => p.severity === 4).length;

  const tabs: { id: PanelTab; label: string; badge?: number }[] = [
    { id: "console", label: "Console", badge: logCount || undefined },
    { id: "problems", label: "Problems", badge: problems.length || undefined },
    { id: "output", label: "Output" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/60">
      {/* Tab header */}
      <div className="flex shrink-0 items-center border-b border-border/10 pl-1 pr-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setPanelTab(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
              panelTab === t.id ? "text-text" : "text-muted hover:text-text"
            )}
          >
            {t.label}
            {t.badge ? (
              <span className="rounded-full bg-glass/70 px-1.5 text-[9.5px] tabular-nums text-muted">
                {t.badge}
              </span>
            ) : null}
            {panelTab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}

        {/* Quick problem tallies */}
        {(errorCount > 0 || warnCount > 0) && (
          <div className="ml-2 flex items-center gap-2 text-[10.5px] text-muted">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-danger">
                <Ban className="h-3 w-3" /> {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertCircle className="h-3 w-3" /> {warnCount}
              </span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {panelTab === "console" && (
            <button
              onClick={clearLogs}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-glass/60 hover:text-text"
              aria-label="Clear console"
              title="Clear console"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setPanelOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-glass/60 hover:text-text"
            aria-label="Close panel"
            title="Close panel"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panelTab === "console" && <Console />}
        {panelTab === "problems" && <ProblemsList problems={problems} />}
        {panelTab === "output" && (
          <div className="px-3 py-2 font-mono text-[11.5px] text-muted/60">
            Nexus IDE ready. Output from tasks &amp; runtimes will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemsList({ problems }: { problems: Problem[] }) {
  if (problems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-xs text-muted/60">
        <Info className="h-3.5 w-3.5" /> No problems detected
      </div>
    );
  }
  return (
    <div className="py-1">
      {problems.map((p) => (
        <div
          key={p.key}
          className="flex items-start gap-2 px-3 py-1 text-[11.5px]"
        >
          {p.severity === 8 ? (
            <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
          ) : p.severity === 4 ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          )}
          <span className="min-w-0 flex-1 text-text/85">{p.message}</span>
          <span className="shrink-0 text-muted/60">
            {p.resource.split("/").pop()}:{p.line}:{p.column}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Subscribe to Monaco marker changes and flatten them into a Problems list. */
function useMonacoProblems(): Problem[] {
  const monaco = useMonaco();
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    if (!monaco) return;
    const refresh = () => {
      const markers = monaco.editor.getModelMarkers({});
      setProblems(
        markers.map((m, i) => ({
          key: `${m.resource.toString()}:${m.startLineNumber}:${m.startColumn}:${i}`,
          severity: m.severity,
          message: m.message,
          resource: m.resource.toString(),
          line: m.startLineNumber,
          column: m.startColumn,
        }))
      );
    };
    refresh();
    const sub = monaco.editor.onDidChangeMarkers(refresh);
    return () => sub.dispose();
  }, [monaco]);

  return problems;
}
