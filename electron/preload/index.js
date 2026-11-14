// electron/preload/index.js
//
// Secure bridge between the Nexus renderer and the Electron main process.
// Runs sandboxed with contextIsolation ON. We expose ONLY the small, explicit
// `window.nexusBrowser` surface below — never ipcRenderer, require, or Node.
//
// NOTE: sandboxed preloads cannot require() local project files, so the channel
// names are inlined here. They MUST stay identical to electron/ipc/channels.js.

const { contextBridge, ipcRenderer } = require("electron");

const CH = {
  TAB_CREATE: "nexus:tab:create",
  TAB_NAVIGATE: "nexus:tab:navigate",
  TAB_BACK: "nexus:tab:back",
  TAB_FORWARD: "nexus:tab:forward",
  TAB_RELOAD: "nexus:tab:reload",
  TAB_STOP: "nexus:tab:stop",
  TAB_SET_ACTIVE: "nexus:tab:setActive",
  TAB_CLOSE: "nexus:tab:close",

  VIEW_SET_BOUNDS: "nexus:view:setBounds",
  VIEW_SET_VISIBLE: "nexus:view:setVisible",
  VIEW_SET_ZOOM: "nexus:view:setZoom",
  VIEW_DEVTOOLS: "nexus:view:devtools",
  VIEW_FIND: "nexus:view:find",
  VIEW_STOP_FIND: "nexus:view:stopFind",
  VIEW_SAVE_PDF: "nexus:view:savePdf",

  DL_PAUSE: "nexus:dl:pause",
  DL_RESUME: "nexus:dl:resume",
  DL_CANCEL: "nexus:dl:cancel",
  DL_OPEN_FOLDER: "nexus:dl:openFolder",
  DL_OPEN_FILE: "nexus:dl:openFile",

  EVT_TAB_UPDATE: "nexus:evt:tabUpdate",
  EVT_NEW_TAB: "nexus:evt:newTab",
  EVT_DOWNLOAD: "nexus:evt:download",
  EVT_PERMISSION: "nexus:evt:permission",
  EVT_FULLSCREEN: "nexus:evt:fullscreen",
};

/**
 * Subscribe to a main->renderer channel. Strips the Electron event object so
 * the renderer only ever sees the payload. Returns an unsubscribe function.
 */
function subscribe(channel, callback) {
  if (typeof callback !== "function") return () => {};
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api = {
  /** Always true here — used by the renderer to detect the Electron shell. */
  isElectron: true,

  // ---------------------------------------------------------------- tabs
  /** Ensure a native view exists for this tab (created lazily on first use). */
  createTab: (tabId) => ipcRenderer.invoke(CH.TAB_CREATE, { tabId }),
  navigate: (tabId, url) => ipcRenderer.invoke(CH.TAB_NAVIGATE, { tabId, url }),
  back: (tabId) => ipcRenderer.invoke(CH.TAB_BACK, { tabId }),
  forward: (tabId) => ipcRenderer.invoke(CH.TAB_FORWARD, { tabId }),
  reload: (tabId, ignoreCache = false) =>
    ipcRenderer.invoke(CH.TAB_RELOAD, { tabId, ignoreCache }),
  stop: (tabId) => ipcRenderer.invoke(CH.TAB_STOP, { tabId }),
  setActiveTab: (tabId) => ipcRenderer.invoke(CH.TAB_SET_ACTIVE, { tabId }),
  closeTab: (tabId) => ipcRenderer.invoke(CH.TAB_CLOSE, { tabId }),

  // ------------------------------------------------------- overlay control
  /** Position the active view. rect = { x, y, width, height } in CSS px. */
  setBounds: (rect) => ipcRenderer.send(CH.VIEW_SET_BOUNDS, rect),
  setVisible: (visible) => ipcRenderer.send(CH.VIEW_SET_VISIBLE, { visible }),
  setZoom: (tabId, factor) =>
    ipcRenderer.send(CH.VIEW_SET_ZOOM, { tabId, factor }),
  openDevTools: (tabId) => ipcRenderer.send(CH.VIEW_DEVTOOLS, { tabId }),
  find: (tabId, text, options = {}) =>
    ipcRenderer.send(CH.VIEW_FIND, { tabId, text, options }),
  stopFind: (tabId) => ipcRenderer.send(CH.VIEW_STOP_FIND, { tabId }),
  savePdf: (tabId) => ipcRenderer.invoke(CH.VIEW_SAVE_PDF, { tabId }),

  // --------------------------------------------------------------- downloads
  downloads: {
    pause: (id) => ipcRenderer.invoke(CH.DL_PAUSE, { id }),
    resume: (id) => ipcRenderer.invoke(CH.DL_RESUME, { id }),
    cancel: (id) => ipcRenderer.invoke(CH.DL_CANCEL, { id }),
    openFolder: (id) => ipcRenderer.invoke(CH.DL_OPEN_FOLDER, { id }),
    openFile: (id) => ipcRenderer.invoke(CH.DL_OPEN_FILE, { id }),
  },

  // ----------------------------------------------------------------- events
  onTabUpdate: (cb) => subscribe(CH.EVT_TAB_UPDATE, cb),
  onNewTab: (cb) => subscribe(CH.EVT_NEW_TAB, cb),
  onDownload: (cb) => subscribe(CH.EVT_DOWNLOAD, cb),
  onPermission: (cb) => subscribe(CH.EVT_PERMISSION, cb),
  onFullscreen: (cb) => subscribe(CH.EVT_FULLSCREEN, cb),
};

contextBridge.exposeInMainWorld("nexusBrowser", api);
