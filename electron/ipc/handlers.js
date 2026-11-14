// electron/ipc/handlers.js
//
// Registers every ipcMain handler and routes it to the BrowserViews manager or
// the downloads controller. This is the full list of actions the (untrusted)
// renderer is permitted to trigger — the trust boundary lives here.

const { ipcMain } = require("electron");
const { CH } = require("./channels");

/**
 * @param {object} deps
 * @param {import("../main/browser-views").BrowserViews} deps.views
 * @param {ReturnType<typeof import("../main/downloads").installDownloadHandlers>} deps.downloads
 */
function registerIpcHandlers({ views, downloads }) {
  const tabId = (p) => p && typeof p.tabId === "string" && p.tabId;

  // ---- tabs / navigation (invoke -> ack) ----
  ipcMain.handle(CH.TAB_CREATE, (_e, p) => (tabId(p) ? (views.ensure(p.tabId), true) : false));
  ipcMain.handle(CH.TAB_NAVIGATE, (_e, p) => (tabId(p) ? (views.navigate(p.tabId, String(p.url || "")), true) : false));
  ipcMain.handle(CH.TAB_BACK, (_e, p) => (tabId(p) ? (views.back(p.tabId), true) : false));
  ipcMain.handle(CH.TAB_FORWARD, (_e, p) => (tabId(p) ? (views.forward(p.tabId), true) : false));
  ipcMain.handle(CH.TAB_RELOAD, (_e, p) => (tabId(p) ? (views.reload(p.tabId, !!p.ignoreCache), true) : false));
  ipcMain.handle(CH.TAB_STOP, (_e, p) => (tabId(p) ? (views.stop(p.tabId), true) : false));
  ipcMain.handle(CH.TAB_SET_ACTIVE, (_e, p) => (tabId(p) ? (views.setActive(p.tabId), true) : false));
  ipcMain.handle(CH.TAB_CLOSE, (_e, p) => (tabId(p) ? (views.close(p.tabId), true) : false));
  ipcMain.handle(CH.VIEW_SAVE_PDF, (_e, p) => (tabId(p) ? views.savePdf(p.tabId) : { ok: false }));

  // ---- overlay control (fire-and-forget) ----
  ipcMain.on(CH.VIEW_SET_BOUNDS, (_e, rect) => {
    if (rect && typeof rect.width === "number") views.setBounds(rect);
  });
  ipcMain.on(CH.VIEW_SET_VISIBLE, (_e, p) => views.setVisible(!!(p && p.visible)));
  ipcMain.on(CH.VIEW_SET_ZOOM, (_e, p) => {
    if (tabId(p) && typeof p.factor === "number") views.setZoom(p.tabId, p.factor);
  });
  ipcMain.on(CH.VIEW_DEVTOOLS, (_e, p) => tabId(p) && views.openDevTools(p.tabId));
  ipcMain.on(CH.VIEW_FIND, (_e, p) => tabId(p) && views.find(p.tabId, String(p.text || ""), p.options || {}));
  ipcMain.on(CH.VIEW_STOP_FIND, (_e, p) => tabId(p) && views.stopFind(p.tabId));

  // ---- downloads ----
  const dlId = (p) => p && typeof p.id === "string" && p.id;
  ipcMain.handle(CH.DL_PAUSE, (_e, p) => (dlId(p) ? downloads.pause(p.id) : false));
  ipcMain.handle(CH.DL_RESUME, (_e, p) => (dlId(p) ? downloads.resume(p.id) : false));
  ipcMain.handle(CH.DL_CANCEL, (_e, p) => (dlId(p) ? downloads.cancel(p.id) : false));
  ipcMain.handle(CH.DL_OPEN_FOLDER, (_e, p) => (dlId(p) ? downloads.openFolder(p.id) : false));
  ipcMain.handle(CH.DL_OPEN_FILE, (_e, p) => (dlId(p) ? downloads.openFile(p.id) : false));
}

module.exports = { registerIpcHandlers };
