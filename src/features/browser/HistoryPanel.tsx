"use client";

import { useMemo } from "react";
import { Clock, Globe, Trash, Trash2 } from "lucide-react";
import { useBrowserStore, type HistoryEntry } from "@/store/useBrowserStore";
import { timeAgo } from "@/lib/utils";
import { hostOf, prettyUrl } from "./helpers";
import { SidePanel, PanelEmpty } from "./SidePanel";

/** Group history entries by calendar day for a tidy timeline. */
function groupByDay(entries: HistoryEntry[]): [string, HistoryEntry[]][] {
  const groups = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const label = new Date(e.visitedAt).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const list = groups.get(label) ?? [];
    list.push(e);
    groups.set(label, list);
  }
  return [...groups.entries()];
}

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const history = useBrowserStore((s) => s.history);
  const removeHistory = useBrowserStore((s) => s.removeHistory);
  const clearHistory = useBrowserStore((s) => s.clearHistory);
  const navigate = useBrowserStore((s) => s.navigate);
  const activeTabId = useBrowserStore((s) => s.activeTabId);

  const groups = useMemo(() => groupByDay(history), [history]);

  const open = (url: string) => {
    navigate(activeTabId, url);
    onClose();
  };

  return (
    <SidePanel title="History" icon={Clock} onClose={onClose}>
      {history.length === 0 ? (
        <PanelEmpty icon={Clock} text="Your browsing history will appear here." />
      ) : (
        <>
          <button
            onClick={clearHistory}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border/10 px-3 py-2 text-xs text-muted transition hover:bg-glass hover:text-red-400"
          >
            <Trash className="h-3.5 w-3.5" /> Clear all history
          </button>
          {groups.map(([day, items]) => (
            <div key={day} className="mb-3">
              <h3 className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted/70">
                {day}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {items.map((h) => (
                  <li
                    key={h.id}
                    className="group flex items-center gap-3 rounded-lg px-3 py-1.5 transition hover:bg-glass/50"
                  >
                    <button
                      onClick={() => open(h.url)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      title={h.url}
                    >
                      {h.favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.favicon} alt="" className="h-4 w-4 shrink-0 rounded" />
                      ) : (
                        <Globe className="h-4 w-4 shrink-0 text-muted" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text">
                          {h.title || hostOf(h.url)}
                        </span>
                        <span className="block truncate text-xs text-muted/70">
                          {prettyUrl(h.url)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted/60">
                        {timeAgo(h.visitedAt)}
                      </span>
                    </button>
                    <button
                      onClick={() => removeHistory(h.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-glass hover:text-red-400 group-hover:opacity-100"
                      aria-label="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </SidePanel>
  );
}
