"use client";

import { Files, Search, Play, Sparkles, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../store/useCodeStudioStore";
import type { SidebarView } from "../types";

const ITEMS: { view: SidebarView; icon: LucideIcon; label: string }[] = [
  { view: "explorer", icon: Files, label: "Explorer" },
  { view: "search", icon: Search, label: "Search" },
  { view: "run", icon: Play, label: "Run & Preview" },
  { view: "ai", icon: Sparkles, label: "AI Assistant" },
  { view: "settings", icon: Settings2, label: "Settings" },
];

/** Left icon rail; selecting a view opens that sidebar panel (VS Code style). */
export default function ActivityBar() {
  const sidebarView = useCodeStudioStore((s) => s.sidebarView);
  const sidebarOpen = useCodeStudioStore((s) => s.sidebarOpen);
  const setSidebarView = useCodeStudioStore((s) => s.setSidebarView);

  return (
    <div className="flex h-full w-11 shrink-0 flex-col items-center gap-1 border-r border-border/10 bg-surface/40 py-2">
      {ITEMS.map(({ view, icon: Icon, label }) => {
        const active = sidebarOpen && sidebarView === view;
        return (
          <button
            key={view}
            onClick={() => setSidebarView(view)}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              active ? "text-text" : "text-muted hover:text-text"
            )}
            aria-label={label}
            title={label}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
            )}
            <Icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
