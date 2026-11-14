// src/lib/nexusBridge.ts
//
// Typed, SSR-safe access to the Electron preload bridge (window.nexusBrowser).
// On the web this is simply absent and isElectron() returns false, so the
// browser transparently falls back to its iframe implementation.

export interface TabUpdate {
  tabId: string;
  url?: string;
  title?: string;
  favicon?: string;
  loading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  failed?: { code: number; desc: string; url: string };
}

export interface DownloadEvent {
  id: string;
  name: string;
  url: string;
  mime?: string;
  totalBytes: number;
  receivedBytes: number;
  savePath?: string;
  state: "progressing" | "completed" | "cancelled" | "interrupted";
  paused: boolean;
  startTime?: number;
  event: "started" | "updated" | "done";
  updatedState?: "progressing" | "interrupted";
}

export interface PermissionEvent {
  kind: string;
  granted: boolean;
  origin: string;
}

export interface FullscreenEvent {
  tabId: string;
  active: boolean;
}

export interface NexusBrowserAPI {
  isElectron: true;

  createTab: (tabId: string) => Promise<boolean>;
  navigate: (tabId: string, url: string) => Promise<boolean>;
  back: (tabId: string) => Promise<boolean>;
  forward: (tabId: string) => Promise<boolean>;
  reload: (tabId: string, ignoreCache?: boolean) => Promise<boolean>;
  stop: (tabId: string) => Promise<boolean>;
  setActiveTab: (tabId: string) => Promise<boolean>;
  closeTab: (tabId: string) => Promise<boolean>;

  setBounds: (rect: { x: number; y: number; width: number; height: number }) => void;
  setVisible: (visible: boolean) => void;
  setZoom: (tabId: string, factor: number) => void;
  openDevTools: (tabId: string) => void;
  find: (tabId: string, text: string, options?: Record<string, unknown>) => void;
  stopFind: (tabId: string) => void;
  savePdf: (tabId: string) => Promise<{ ok: boolean; filePath?: string; error?: string }>;

  downloads: {
    pause: (id: string) => Promise<boolean>;
    resume: (id: string) => Promise<boolean>;
    cancel: (id: string) => Promise<boolean>;
    openFolder: (id: string) => Promise<boolean>;
    openFile: (id: string) => Promise<boolean>;
  };

  onTabUpdate: (cb: (p: TabUpdate) => void) => () => void;
  onNewTab: (cb: (p: { url: string }) => void) => () => void;
  onDownload: (cb: (p: DownloadEvent) => void) => () => void;
  onPermission: (cb: (p: PermissionEvent) => void) => () => void;
  onFullscreen: (cb: (p: FullscreenEvent) => void) => () => void;
}

declare global {
  interface Window {
    nexusBrowser?: NexusBrowserAPI;
  }
}

/** True only inside the Electron shell (preload injected the bridge). */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.nexusBrowser?.isElectron;
}

/** The bridge, or null on the web / during SSR. */
export function getBridge(): NexusBrowserAPI | null {
  if (typeof window === "undefined") return null;
  return window.nexusBrowser ?? null;
}
