"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useNativeBrowser } from "./useNativeBrowser";
import { TabStrip } from "./TabStrip";
import { Toolbar } from "./Toolbar";
import { Viewport } from "./Viewport";
import { BookmarksPanel } from "./BookmarksPanel";
import { HistoryPanel } from "./HistoryPanel";
import { DownloadsPanel } from "./DownloadsPanel";
import { SettingsPanel } from "./SettingsPanel";

export type PanelKey = "bookmarks" | "history" | "downloads" | "settings" | null;

/**
 * Nexus Browser — a native tabbed browser app for the OS.
 * Self-contained: all state lives in `useBrowserStore`; nothing here touches
 * other apps or the global theme (dark mode is a panel-local class only).
 */
export default function Browser() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const settings = useBrowserStore((s) => s.settings);
  const setSettings = useBrowserStore((s) => s.setSettings);
  const newTab = useBrowserStore((s) => s.newTab);
  const closeTab = useBrowserStore((s) => s.closeTab);
  const setActiveTab = useBrowserStore((s) => s.setActiveTab);
  const reload = useBrowserStore((s) => s.reload);
  const setUi = useBrowserStore((s) => s.setUi);

  // Drive the native Chromium engine in the Electron shell (no-op on the web).
  useNativeBrowser();

  const rootRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<PanelKey>(null);

  // The native browser view floats above HTML, so hide it while a side panel
  // is open over the page.
  useEffect(() => {
    setUi({ panelOpen: panel !== null });
  }, [panel, setUi]);

  const dark = settings.defaultDark;
  const toggleDark = useCallback(
    () => setSettings({ defaultDark: !settings.defaultDark }),
    [settings.defaultDark, setSettings]
  );

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Keyboard shortcuts — only when focus/hover is inside this app window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const within =
        root.contains(document.activeElement) || root.matches(":hover");
      if (!within) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();

      if (key === "t") {
        e.preventDefault();
        newTab();
      } else if (key === "w") {
        e.preventDefault();
        closeTab(activeTabId);
      } else if (key === "r") {
        e.preventDefault();
        reload(activeTabId);
      } else if (key === "l") {
        e.preventDefault();
        const input = root.querySelector<HTMLInputElement>(
          "input[data-browser-address]"
        );
        input?.focus();
        input?.select();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const list = useBrowserStore.getState().tabs;
        const idx = list.findIndex((t) => t.id === activeTabId);
        if (idx === -1 || list.length < 2) return;
        const next = e.shiftKey
          ? (idx - 1 + list.length) % list.length
          : (idx + 1) % list.length;
        setActiveTab(list[next].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTabId, newTab, closeTab, reload, setActiveTab]);

  if (!activeTab) return null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-bg text-text",
        !dark && "theme-light"
      )}
    >
      <TabStrip />
      <Toolbar
        tab={activeTab}
        dark={dark}
        onToggleDark={toggleDark}
        onOpenPanel={setPanel}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden border-t border-border/10">
        <Viewport tab={activeTab} />

        <AnimatePresence>
          {panel === "bookmarks" && <BookmarksPanel onClose={() => setPanel(null)} />}
          {panel === "history" && <HistoryPanel onClose={() => setPanel(null)} />}
          {panel === "downloads" && <DownloadsPanel onClose={() => setPanel(null)} />}
          {panel === "settings" && (
            <SettingsPanel
              onClose={() => setPanel(null)}
              dark={dark}
              onToggleDark={toggleDark}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
