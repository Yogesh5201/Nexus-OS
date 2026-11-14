"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { id } from "@/lib/utils";
import { isElectron, getBridge } from "@/lib/nexusBridge";

/** A single open browser tab with its own back/forward stack. */
export interface Tab {
  id: string;
  title: string;
  /** Empty string => show the Start/New-Tab page. */
  url: string;
  favicon: string;
  /** Per-tab navigation stack (oldest → newest). */
  history: string[];
  /** Index into `history` for the currently shown entry. */
  cursor: number;
  loading: boolean;
  incognito: boolean;
  readerMode: boolean;
  /**
   * In the Electron shell, Chromium owns the real back/forward state; these
   * mirror it. Undefined on the web (the `cursor`-based logic is used instead).
   */
  canGoBack?: boolean;
  canGoForward?: boolean;
  /** Last main-frame load failure (Electron), cleared on successful navigation. */
  error?: { code: number; desc: string; url: string } | null;
}

/**
 * Transient UI flags (never persisted). The native browser view floats above
 * all HTML, so it must hide itself while any of these Nexus surfaces are open.
 */
export interface BrowserUiFlags {
  addressFocused: boolean;
  menuOpen: boolean;
  panelOpen: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon: string;
  visitedAt: number;
}

export type DownloadStatus = "in_progress" | "complete" | "failed";

export interface Download {
  id: string;
  name: string;
  url: string;
  size: number;
  progress: number;
  status: DownloadStatus;
  createdAt: number;
  /** Electron only: whether an in-progress download is currently paused. */
  paused?: boolean;
}

export type SearchEngine = "duckduckgo" | "google" | "bing";

export interface BrowserSettings {
  searchEngine: SearchEngine;
  defaultDark: boolean;
  openInNewTab: boolean;
  suggestions: boolean;
}

interface BrowserStore {
  tabs: Tab[];
  activeTabId: string;
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  downloads: Download[];
  settings: BrowserSettings;
  ui: BrowserUiFlags;

  // ---- tabs ----
  newTab: (url?: string, incognito?: boolean) => string;
  newIncognitoTab: () => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  navigate: (tabId: string, url: string) => void;
  setTabLoading: (tabId: string, loading: boolean) => void;
  setTabMeta: (tabId: string, patch: Partial<Pick<Tab, "title" | "favicon">>) => void;
  /** Apply live navigation state from the native (Electron) engine. */
  setTabNavState: (
    tabId: string,
    patch: Partial<
      Pick<Tab, "url" | "title" | "favicon" | "loading" | "canGoBack" | "canGoForward" | "error">
    >
  ) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  reload: (tabId: string, ignoreCache?: boolean) => void;
  toggleReader: (tabId: string) => void;
  setUi: (patch: Partial<BrowserUiFlags>) => void;

  // ---- bookmarks ----
  addBookmark: (b: Omit<Bookmark, "id" | "createdAt">) => void;
  removeBookmark: (url: string) => void;
  isBookmarked: (url: string) => boolean;

  // ---- history ----
  addHistory: (e: Omit<HistoryEntry, "id" | "visitedAt">) => void;
  clearHistory: () => void;
  removeHistory: (id: string) => void;

  // ---- downloads ----
  addDownload: (d: Omit<Download, "id" | "createdAt">) => string;
  /** Insert-or-update a download by id (used by the native download engine). */
  upsertDownload: (d: Download) => void;
  updateDownload: (id: string, patch: Partial<Download>) => void;
  clearDownloads: () => void;

  // ---- settings ----
  setSettings: (patch: Partial<BrowserSettings>) => void;
}

const HISTORY_CAP = 500;

const FALLBACK_FAVICON = "";

/** Create a fresh tab object. */
function makeTab(url = "", incognito = false): Tab {
  return {
    id: id("tab"),
    title: url ? url : "New Tab",
    url,
    favicon: FALLBACK_FAVICON,
    history: url ? [url] : [],
    cursor: url ? 0 : -1,
    loading: false,
    incognito,
    readerMode: false,
  };
}

const seedTab = makeTab();

export const useBrowserStore = create<BrowserStore>()(
  persist(
    (set, get) => ({
      tabs: [seedTab],
      activeTabId: seedTab.id,
      bookmarks: [],
      history: [],
      downloads: [],
      settings: {
        searchEngine: "duckduckgo",
        defaultDark: true,
        openInNewTab: false,
        suggestions: true,
      },
      ui: { addressFocused: false, menuOpen: false, panelOpen: false },

      // ---------------------------------------------------------------- tabs
      newTab: (url = "", incognito = false) => {
        const tab = makeTab(url, incognito);
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
        return tab.id;
      },

      newIncognitoTab: () => get().newTab("", true),

      closeTab: (tabId) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === tabId);
          if (idx === -1) return s;
          const tabs = s.tabs.filter((t) => t.id !== tabId);
          // Never leave the browser with zero tabs.
          if (tabs.length === 0) {
            const fresh = makeTab();
            return { tabs: [fresh], activeTabId: fresh.id };
          }
          let activeTabId = s.activeTabId;
          if (activeTabId === tabId) {
            const neighbor = tabs[Math.min(idx, tabs.length - 1)];
            activeTabId = neighbor.id;
          }
          return { tabs, activeTabId };
        }),

      setActiveTab: (activeTabId) => set({ activeTabId }),

      navigate: (tabId, rawUrl) => {
        const url = rawUrl.trim();
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== tabId) return t;
            // Truncate any forward history, then push the new entry.
            const base = t.history.slice(0, t.cursor + 1);
            const history = [...base, url];
            return {
              ...t,
              url,
              title: url || "New Tab",
              favicon: FALLBACK_FAVICON,
              history,
              cursor: history.length - 1,
              loading: Boolean(url),
              readerMode: false,
              error: null,
            };
          }),
        }));
        // In the Electron shell, hand the actual load to real Chromium.
        if (url && isElectron()) getBridge()?.navigate(tabId, url);
      },

      setTabLoading: (tabId, loading) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, loading } : t)),
        })),

      setTabMeta: (tabId, patch) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
        })),

      setTabNavState: (tabId, patch) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
        })),

      goBack: (tabId) => {
        if (isElectron()) {
          getBridge()?.back(tabId);
          set((s) => ({
            tabs: s.tabs.map((t) =>
              t.id === tabId ? { ...t, loading: true, readerMode: false } : t
            ),
          }));
          return;
        }
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== tabId || t.cursor <= 0) return t;
            const cursor = t.cursor - 1;
            return { ...t, cursor, url: t.history[cursor], loading: true, readerMode: false };
          }),
        }));
      },

      goForward: (tabId) => {
        if (isElectron()) {
          getBridge()?.forward(tabId);
          set((s) => ({
            tabs: s.tabs.map((t) =>
              t.id === tabId ? { ...t, loading: true, readerMode: false } : t
            ),
          }));
          return;
        }
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== tabId || t.cursor >= t.history.length - 1) return t;
            const cursor = t.cursor + 1;
            return { ...t, cursor, url: t.history[cursor], loading: true, readerMode: false };
          }),
        }));
      },

      reload: (tabId, ignoreCache = false) => {
        if (isElectron()) getBridge()?.reload(tabId, ignoreCache);
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId && t.url ? { ...t, loading: true } : t
          ),
        }));
      },

      toggleReader: (tabId) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, readerMode: !t.readerMode } : t
          ),
        })),

      setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

      // ----------------------------------------------------------- bookmarks
      addBookmark: (b) =>
        set((s) => {
          if (s.bookmarks.some((x) => x.url === b.url)) return s;
          return {
            bookmarks: [
              { ...b, id: id("bm"), createdAt: Date.now() },
              ...s.bookmarks,
            ],
          };
        }),

      removeBookmark: (url) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.url !== url) })),

      isBookmarked: (url) => get().bookmarks.some((b) => b.url === url),

      // ------------------------------------------------------------- history
      addHistory: (e) =>
        set((s) => {
          // Dedupe by recency: drop any prior entry with the same URL.
          const filtered = s.history.filter((h) => h.url !== e.url);
          const next: HistoryEntry = {
            ...e,
            id: id("hist"),
            visitedAt: Date.now(),
          };
          return { history: [next, ...filtered].slice(0, HISTORY_CAP) };
        }),

      clearHistory: () => set({ history: [] }),

      removeHistory: (histId) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== histId) })),

      // ----------------------------------------------------------- downloads
      addDownload: (d) => {
        const dl: Download = { ...d, id: id("dl"), createdAt: Date.now() };
        set((s) => ({ downloads: [dl, ...s.downloads] }));
        return dl.id;
      },

      upsertDownload: (d) =>
        set((s) => {
          const exists = s.downloads.some((x) => x.id === d.id);
          return {
            downloads: exists
              ? s.downloads.map((x) => (x.id === d.id ? { ...x, ...d } : x))
              : [d, ...s.downloads],
          };
        }),

      updateDownload: (dlId, patch) =>
        set((s) => ({
          downloads: s.downloads.map((d) => (d.id === dlId ? { ...d, ...patch } : d)),
        })),

      clearDownloads: () => set({ downloads: [] }),

      // ------------------------------------------------------------ settings
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "nexus.browser",
      // Persist history/bookmarks/downloads/settings, but only NON-incognito
      // tabs and never transient loading flags.
      partialize: (s) => ({
        tabs: s.tabs
          .filter((t) => !t.incognito)
          .map((t) => ({ ...t, loading: false })),
        activeTabId: s.activeTabId,
        bookmarks: s.bookmarks,
        history: s.history,
        downloads: s.downloads,
        settings: s.settings,
      }),
      // After rehydrate, make sure there's always a valid active tab.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.tabs.length === 0) {
          const fresh = makeTab();
          state.tabs = [fresh];
          state.activeTabId = fresh.id;
        } else if (!state.tabs.some((t) => t.id === state.activeTabId)) {
          state.activeTabId = state.tabs[0].id;
        }
      },
    }
  )
);
