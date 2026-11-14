// electron/main/downloads.js
//
// Real download handling for the browsing session: progress streaming plus
// pause / resume / cancel / reveal. DownloadItem objects live only in main; the
// renderer references them by a stable id and drives them over IPC.

const { shell } = require("electron");
const { CH } = require("../ipc/channels");

/**
 * @param {Electron.Session} session
 * @param {() => Electron.WebContents | null} getRendererWC
 */
function installDownloadHandlers(session, getRendererWC) {
  /** id -> Electron.DownloadItem */
  const items = new Map();
  let counter = 0;

  const send = (payload) => {
    const wc = getRendererWC();
    if (wc && !wc.isDestroyed()) wc.send(CH.EVT_DOWNLOAD, payload);
  };

  const snapshot = (id, item) => ({
    id,
    name: item.getFilename(),
    url: item.getURL(),
    mime: item.getMimeType(),
    totalBytes: item.getTotalBytes(),
    receivedBytes: item.getReceivedBytes(),
    savePath: item.getSavePath(),
    state: item.getState(), // 'progressing' | 'completed' | 'cancelled' | 'interrupted'
    paused: item.isPaused(),
    startTime: item.getStartTime(),
  });

  session.on("will-download", (_event, item) => {
    const id = `dl_${Date.now().toString(36)}_${counter++}`;
    items.set(id, item);

    // Announce the download; renderer creates the store entry with this id.
    send({ ...snapshot(id, item), event: "started" });

    item.on("updated", (_e, state) => {
      send({ ...snapshot(id, item), event: "updated", updatedState: state });
    });

    item.once("done", (_e, state) => {
      send({ ...snapshot(id, item), event: "done", state });
      // Keep completed items around briefly so "open folder/file" works, then
      // drop cancelled/failed ones immediately.
      if (state === "completed") {
        // retain for reveal
      } else {
        items.delete(id);
      }
    });
  });

  // ---- control surface used by the IPC handlers ----
  return {
    pause(id) {
      const item = items.get(id);
      if (item && item.canResume?.() !== undefined) item.pause();
      else if (item) item.pause();
      return Boolean(item);
    },
    resume(id) {
      const item = items.get(id);
      if (item && item.isPaused()) item.resume();
      return Boolean(item);
    },
    cancel(id) {
      const item = items.get(id);
      if (item) item.cancel();
      items.delete(id);
      return Boolean(item);
    },
    openFolder(id) {
      const item = items.get(id);
      const p = item?.getSavePath();
      if (p) {
        shell.showItemInFolder(p);
        return true;
      }
      return false;
    },
    openFile(id) {
      const item = items.get(id);
      const p = item?.getSavePath();
      if (p) {
        shell.openPath(p);
        return true;
      }
      return false;
    },
  };
}

module.exports = { installDownloadHandlers };
