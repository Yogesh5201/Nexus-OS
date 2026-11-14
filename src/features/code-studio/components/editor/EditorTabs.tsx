"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import { iconFor } from "../../data/languages";

/** Open-editor tab strip: activate, close, middle-click close, drag-reorder. */
export default function EditorTabs() {
  const openTabIds = useCodeStudioStore((s) => s.openTabIds);
  const activeTabId = useCodeStudioStore((s) => s.activeTabId);
  const setActiveTab = useCodeStudioStore((s) => s.setActiveTab);
  const closeTab = useCodeStudioStore((s) => s.closeTab);
  const reorderTabs = useCodeStudioStore((s) => s.reorderTabs);
  const nodes = useCodeStudioStore((s) => s.nodes);

  const [dragId, setDragId] = useState<string | null>(null);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex shrink-0 items-stretch overflow-x-auto border-b border-border/10 bg-surface/30 no-scrollbar">
      {openTabIds.map((tabId) => {
        const node = byId.get(tabId);
        if (!node) return null;
        const active = tabId === activeTabId;
        const Icon = iconFor(node.name);
        return (
          <div
            key={tabId}
            draggable
            onDragStart={() => setDragId(tabId)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId && dragId !== tabId) reorderTabs(dragId, tabId);
              setDragId(null);
            }}
            onClick={() => setActiveTab(tabId)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeTab(tabId);
              }
            }}
            className={cn(
              "group relative flex cursor-pointer items-center gap-1.5 border-r border-border/10 px-3 py-1.5 text-[12px] transition-colors",
              active
                ? "bg-bg/40 text-text"
                : "text-muted hover:bg-glass/40 hover:text-text"
            )}
          >
            {active && (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
            )}
            <Icon className="h-3.5 w-3.5 shrink-0 text-accent/70" />
            <span className="max-w-[140px] truncate">{node.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tabId);
              }}
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded transition-opacity hover:bg-glass/70",
                active ? "opacity-70" : "opacity-0 group-hover:opacity-70"
              )}
              aria-label={`Close ${node.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
