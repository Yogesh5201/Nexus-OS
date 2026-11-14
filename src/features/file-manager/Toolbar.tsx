"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronRight,
  FolderPlus,
  Grid3x3,
  List,
  Search,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/store/useFilesStore";
import type { SortDir, SortKey, ViewMode } from "./helpers";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "modified", label: "Date modified" },
  { key: "size", label: "Size" },
  { key: "type", label: "Type" },
];

interface ToolbarProps {
  isFolderView: boolean;
  viewLabel: string;
  breadcrumb: FileNode[];
  canBack: boolean;
  canForward: boolean;
  canUp: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onCrumb: (folderId: string | null) => void;
  search: string;
  onSearch: (q: string) => void;
  searchRef?: React.RefObject<HTMLInputElement>;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  onNewFolder: () => void;
  onUpload: () => void;
}

function NavButton({
  icon: Icon,
  disabled,
  onClick,
  label,
}: {
  icon: typeof ArrowLeft;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        disabled ? "text-muted/30" : "text-muted hover:bg-glass/60 hover:text-text"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Toolbar(props: ToolbarProps) {
  const {
    isFolderView,
    viewLabel,
    breadcrumb,
    canBack,
    canForward,
    canUp,
    onBack,
    onForward,
    onUp,
    onCrumb,
    search,
    onSearch,
    searchRef,
    sortKey,
    sortDir,
    onSort,
    viewMode,
    onViewMode,
    onNewFolder,
    onUpload,
  } = props;

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen]);

  return (
    <div className="flex flex-col gap-2 border-b border-border/10 px-2.5 py-2">
      {/* Row 1: nav + breadcrumb + search */}
      <div className="flex items-center gap-1.5">
        <NavButton icon={ArrowLeft} disabled={!canBack} onClick={onBack} label="Back" />
        <NavButton icon={ArrowRight} disabled={!canForward} onClick={onForward} label="Forward" />
        <NavButton icon={ArrowUp} disabled={!canUp} onClick={onUp} label="Up" />

        {/* Breadcrumb */}
        <div className="ml-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto no-scrollbar text-sm">
          {isFolderView ? (
            <>
              <button
                onClick={() => onCrumb(null)}
                className="shrink-0 rounded-md px-1.5 py-0.5 text-muted hover:bg-glass/60 hover:text-text"
              >
                Home
              </button>
              {breadcrumb.map((node) => (
                <div key={node.id} className="flex shrink-0 items-center">
                  <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
                  <button
                    onClick={() => onCrumb(node.id)}
                    className="max-w-[140px] truncate rounded-md px-1.5 py-0.5 text-text hover:bg-glass/60"
                  >
                    {node.name}
                  </button>
                </div>
              ))}
            </>
          ) : (
            <span className="px-1.5 font-medium text-text">{viewLabel}</span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-40 shrink-0 sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            className="h-8 w-full rounded-lg border border-border/10 bg-glass/40 pl-8 pr-2 text-xs text-text placeholder:text-muted/70 focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onNewFolder}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border/10 bg-glass/40 px-2.5 text-xs text-text transition-colors hover:bg-glass/70"
        >
          <FolderPlus className="h-3.5 w-3.5 text-accent" /> New Folder
        </button>
        <button
          onClick={onUpload}
          className="accent-gradient flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-black/80"
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Sort menu */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/10 bg-glass/40 px-2.5 text-xs text-muted transition-colors hover:bg-glass/70 hover:text-text"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
            </button>
            {sortOpen && (
              <div className="glass-strong absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border/10 p-1 shadow-float">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => onSort(o.key)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text hover:bg-glass/60"
                  >
                    <span className="w-3.5">
                      {sortKey === o.key && <Check className="h-3.5 w-3.5 text-accent" />}
                    </span>
                    <span className="flex-1 text-left">{o.label}</span>
                    {sortKey === o.key && (
                      <span className="text-[10px] text-muted">
                        {sortDir === "asc" ? "Asc" : "Desc"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg bg-glass/40 p-0.5">
            <button
              onClick={() => onViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid" ? "bg-accent/20 text-text" : "text-muted hover:text-text"
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "list" ? "bg-accent/20 text-text" : "text-muted hover:text-text"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
