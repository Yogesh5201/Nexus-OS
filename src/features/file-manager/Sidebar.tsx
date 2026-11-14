"use client";

import {
  Clock,
  HardDrive,
  Heart,
  Home,
  Share2,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { ViewKey } from "./helpers";

export interface SidebarCounts {
  recent: number;
  favorites: number;
  starred: number;
  shared: number;
  trash: number;
}

interface Item {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface SidebarProps {
  view: ViewKey;
  atHome: boolean;
  counts: SidebarCounts;
  storage: { used: number; quota: number };
  onSelect: (key: ViewKey) => void;
  /** Drop nodes onto a sidebar target (Home = move to root, Trash = trash). */
  onDropOnView?: (key: ViewKey) => void;
}

/** macOS-Finder / Windows-Explorer style navigation rail. */
export function Sidebar({ view, atHome, counts, storage, onSelect, onDropOnView }: SidebarProps) {
  const items: Item[] = [
    { key: "folder", label: "Home", icon: Home },
    { key: "recent", label: "Recent", icon: Clock, count: counts.recent },
    { key: "favorites", label: "Favorites", icon: Heart, count: counts.favorites },
    { key: "starred", label: "Starred", icon: Star, count: counts.starred },
    { key: "shared", label: "Shared", icon: Share2, count: counts.shared },
    { key: "trash", label: "Trash", icon: Trash2, count: counts.trash },
  ];

  const pct = storage.quota > 0 ? Math.min(100, (storage.used / storage.quota) * 100) : 0;

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-border/10 bg-glass/20">
      <div className="px-3 py-3">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
          Quick access
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = item.key === "folder" ? atHome : view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                onDragOver={
                  onDropOnView && (item.key === "folder" || item.key === "trash")
                    ? (e) => e.preventDefault()
                    : undefined
                }
                onDrop={
                  onDropOnView && (item.key === "folder" || item.key === "trash")
                    ? (e) => {
                        e.preventDefault();
                        onDropOnView(item.key);
                      }
                    : undefined
                }
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent/20 text-text"
                    : "text-muted hover:bg-glass/50 hover:text-text"
                )}
              >
                <item.icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted group-hover:text-text")}
                />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {item.count ? (
                  <span className="rounded-full bg-glass/60 px-1.5 text-[10px] text-muted">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage usage meter */}
      <div className="mt-auto border-t border-border/10 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <HardDrive className="h-3.5 w-3.5" />
          <span>Storage</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-glass/60">
          <div
            className="accent-gradient h-full rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[10px] text-muted">
          {formatBytes(storage.used)} of {formatBytes(storage.quota)} used
        </div>
      </div>
    </aside>
  );
}
