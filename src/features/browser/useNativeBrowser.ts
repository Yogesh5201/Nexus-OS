"use client";

import { useEffect, useRef } from "react";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";
import { isElectron, getBridge, type DownloadEvent } from "@/lib/nexusBridge";
import { titleFromUrl } from "./helpers";

type NavPatch = Partial<
  Pick<Tab, "url" | "title" | "favicon" | "loading" | "canGoBack" | "canGoForward" | "error">
>;

/**
 * Bridges the browser store to the native Electron engine. Mounted once at the
 * Browser app root. No-op on the web (isElectron() === false), so the iframe
 * path is completely unaffected.
 */
export function useNativeBrowser() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);

  // Tabs whose native view has already been told to load their URL.
  const loaded = useRef<Set<string>>(new Set());
  // Snapshot of known tab ids, to detect closes.
  const known = useRef<Set<string>>(new Set());

  // ---- main -> renderer events (subscribe once) ----
  useEffect(() => {
    if (!isElectron()) return;
    const bridge = getBridge();
    if (!bridge) return;

    const store = () => useBrowserStore.getState();

    const offTab = bridge.onTabUpdate((p) => {
      loaded.current.add(p.tabId);
      const patch: NavPatch = {};
      if (p.url !== undefined) patch.url = p.url;
      if (p.title !== undefined) patch.title = p.title || titleFromUrl(p.url || "");
      if (p.favicon !== undefined) patch.favicon = p.favicon;
      if (p.loading !== undefined) patch.loading = p.loading;
      if (p.canGoBack !== undefined) patch.canGoBack = p.canGoBack;
      if (p.canGoForward !== undefined) patch.canGoForward = p.canGoForward;
      if (p.failed) patch.error = p.failed;
      else if (p.url) patch.error = null;
      store().setTabNavState(p.tabId, patch);

      // Record history once the page settles on a real URL.
      if (p.loading === false && p.url) {
        const tab = store().tabs.find((t) => t.id === p.tabId);
        if (tab && !tab.incognito) {
          store().addHistory({
            url: p.url,
            title: p.title || tab.title || titleFromUrl(p.url),
            favicon: p.favicon || tab.favicon || "",
          });
        }
      }
    });

    const offNew = bridge.onNewTab(({ url }) => {
      if (url) store().newTab(url);
    });

    const offDl = bridge.onDownload((d: DownloadEvent) => {
      const status =
        d.state === "completed"
          ? "complete"
          : d.state === "progressing"
          ? "in_progress"
          : "failed";
      const progress =
        d.totalBytes > 0
          ? Math.min(1, d.receivedBytes / d.totalBytes)
          : status === "complete"
          ? 1
          : 0;
      store().upsertDownload({
        id: d.id,
        name: d.name,
        url: d.url,
        size: d.totalBytes || d.receivedBytes || 0,
        progress,
        status,
        paused: d.paused,
        createdAt: d.startTime ? Math.round(d.startTime * 1000) : Date.now(),
      });
    });

    return () => {
      offTab();
      offNew();
      offDl();
    };
  }, []);

  // ---- close native views for tabs that disappeared ----
  useEffect(() => {
    if (!isElectron()) return;
    const bridge = getBridge();
    if (!bridge) return;
    const current = new Set(tabs.map((t) => t.id));
    for (const id of known.current) {
      if (!current.has(id)) {
        bridge.closeTab(id);
        loaded.current.delete(id);
      }
    }
    known.current = current;
  }, [tabs]);

  // ---- keep the active view current; lazily load restored/background tabs ----
  useEffect(() => {
    if (!isElectron()) return;
    const bridge = getBridge();
    if (!bridge) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    // Start/New-Tab pages have no URL: no native view, keep it hidden.
    if (!tab || !tab.url) {
      bridge.setVisible(false);
      return;
    }
    bridge.setActiveTab(activeTabId);
    if (!loaded.current.has(activeTabId)) {
      loaded.current.add(activeTabId);
      bridge.navigate(activeTabId, tab.url);
    }
  }, [activeTabId, tabs]);
}
