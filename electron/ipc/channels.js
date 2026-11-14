// electron/ipc/channels.js
//
// Central registry of every IPC channel used between the Nexus renderer
// (window.nexusBrowser) and the Electron main process.
//
// IMPORTANT: electron/preload/index.js runs in a *sandboxed* context and
// cannot require() this file, so it inlines the same string literals. If you
// add/rename a channel here, mirror it there. The values below are the
// contract — keep them stable.

const CH = {
  // ---- renderer -> main : tab / navigation (invoke) ----
  TAB_CREATE: "nexus:tab:create",
  TAB_NAVIGATE: "nexus:tab:navigate",
  TAB_BACK: "nexus:tab:back",
  TAB_FORWARD: "nexus:tab:forward",
  TAB_RELOAD: "nexus:tab:reload",
  TAB_STOP: "nexus:tab:stop",
  TAB_SET_ACTIVE: "nexus:tab:setActive",
  TAB_CLOSE: "nexus:tab:close",

  // ---- renderer -> main : the native view overlay (send) ----
  VIEW_SET_BOUNDS: "nexus:view:setBounds",
  VIEW_SET_VISIBLE: "nexus:view:setVisible",
  VIEW_SET_ZOOM: "nexus:view:setZoom",
  VIEW_DEVTOOLS: "nexus:view:devtools",
  VIEW_FIND: "nexus:view:find",
  VIEW_STOP_FIND: "nexus:view:stopFind",
  VIEW_SAVE_PDF: "nexus:view:savePdf",

  // ---- renderer -> main : downloads (invoke) ----
  DL_PAUSE: "nexus:dl:pause",
  DL_RESUME: "nexus:dl:resume",
  DL_CANCEL: "nexus:dl:cancel",
  DL_OPEN_FOLDER: "nexus:dl:openFolder",
  DL_OPEN_FILE: "nexus:dl:openFile",

  // ---- main -> renderer : events (send) ----
  EVT_TAB_UPDATE: "nexus:evt:tabUpdate", // { tabId, url?, title?, favicon?, loading?, canGoBack?, canGoForward?, failed? }
  EVT_NEW_TAB: "nexus:evt:newTab", // { url }
  EVT_DOWNLOAD: "nexus:evt:download", // { id, name, url, state, receivedBytes, totalBytes, savePath, paused }
  EVT_PERMISSION: "nexus:evt:permission", // { kind, granted, origin }
  EVT_FULLSCREEN: "nexus:evt:fullscreen", // { tabId, active }
};

module.exports = { CH };
