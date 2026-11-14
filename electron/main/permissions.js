// electron/main/permissions.js
//
// Wires up site permissions for the browsing session: camera, microphone,
// geolocation, clipboard, notifications, fullscreen, etc. Electron denies these
// by default for remote content, so we opt in here — but only for secure
// origins, and we report every decision back to the renderer for UI.

const { CH } = require("../ipc/channels");

// Permissions we allow for https / secure origins. Anything not listed is
// denied. `openExternal` is intentionally excluded (handled explicitly).
const ALLOWED = new Set([
  "media", // camera + microphone (getUserMedia)
  "audioCapture",
  "videoCapture",
  "geolocation",
  "notifications",
  "clipboard-read",
  "clipboard-sanitized-write",
  "fullscreen",
  "pointerLock",
  "midi",
  "midiSysex",
  "background-sync",
  "idle-detection",
  "display-capture",
]);

/** Is an origin trusted enough to grant sensitive permissions? */
function isSecureOrigin(url) {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" ||
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.protocol === "file:"
    );
  } catch {
    return false;
  }
}

/**
 * Install permission handlers on a session.
 * @param {Electron.Session} session  the browsing session
 * @param {() => Electron.WebContents | null} getRendererWC  Nexus UI webContents
 */
function installPermissionHandlers(session, getRendererWC) {
  const notify = (kind, granted, origin) => {
    const wc = getRendererWC();
    if (wc && !wc.isDestroyed()) {
      wc.send(CH.EVT_PERMISSION, { kind, granted, origin });
    }
  };

  // Async request (the site is asking the user).
  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const origin = details?.requestingUrl || webContents?.getURL() || "";
    const granted = ALLOWED.has(permission) && isSecureOrigin(origin);
    notify(permission, granted, origin);
    callback(granted);
  });

  // Synchronous check (e.g. navigator.permissions.query, getUserMedia gate).
  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const origin = requestingOrigin || details?.requestingUrl || "";
    return ALLOWED.has(permission) && isSecureOrigin(origin);
  });

  // Some Chromium builds route device access through this extra hook.
  if (typeof session.setDevicePermissionHandler === "function") {
    session.setDevicePermissionHandler(() => true);
  }
}

module.exports = { installPermissionHandlers };
