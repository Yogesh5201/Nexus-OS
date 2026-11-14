"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, Plus, X, VenetianMask, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";

/** A single tab pill. */
function TabPill({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: Tab;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "auto" }}
      exit={{ opacity: 0, width: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      onMouseDown={(e) => {
        // Middle-click closes (real-browser muscle memory).
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={onSelect}
      className={cn(
        "group relative flex h-9 min-w-0 max-w-[200px] cursor-pointer items-center gap-2 overflow-hidden rounded-t-lg px-3 text-xs",
        "border-b-2 transition-colors",
        active
          ? "glass-strong border-accent text-text"
          : "border-transparent text-muted hover:bg-glass/40 hover:text-text",
        tab.incognito && "italic"
      )}
      title={tab.url || "New Tab"}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {tab.loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        ) : tab.incognito ? (
          <VenetianMask className="h-3.5 w-3.5 text-violet-400" />
        ) : tab.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tab.favicon}
            alt=""
            className="h-3.5 w-3.5 rounded-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{tab.title || "New Tab"}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition group-hover:opacity-100 hover:bg-glass"
        aria-label="Close tab"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/** Horizontal strip of tabs with a "new tab" button. */
export function TabStrip() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const setActiveTab = useBrowserStore((s) => s.setActiveTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const newTab = useBrowserStore((s) => s.newTab);

  return (
    <div className="flex items-end gap-1 px-2 pt-2">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence initial={false}>
          {tabs.map((tab) => (
            <TabPill
              key={tab.id}
              tab={tab}
              active={tab.id === activeTabId}
              onSelect={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
            />
          ))}
        </AnimatePresence>
      </div>
      <button
        onClick={() => newTab()}
        className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-glass hover:text-text"
        aria-label="New tab"
        title="New tab (Ctrl+T)"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
