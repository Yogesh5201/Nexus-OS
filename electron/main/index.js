// electron/main/index.js
//
// Electron entry point for Nexus OS. Creates the main window (which loads the
// Next.js UI), sets up the isolated persistent browsing session, and wires the
// native browser engine (BrowserViews) to the renderer over secure IPC.

const { app, BrowserWindow, session, shell } = require("electron");
const path = require("path");

const { startNextServer } = require("./next-server");
const { installPermissionHandlers } = require("./permissions");
const { installDownloadHandlers } = require("./downloads");
const { BrowserViews } = require("./browser-views");
const { registerIpcHandlers } = require("../ipc/handlers");

// Single instance — a second launch focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserViews | null} */
let browserViews = null;
/** @type {import("child_process").ChildProcess | null} */
let nextChild = null;

const BROWSING_PARTITION = "persist:nexus-web";

/** A genuine Chrome UA so sites (Google login, etc.) don't reject "Electron". */
function chromeUserAgent() {
  const chrome = process.versions.chrome;
  const platform =
    process.platform === "darwin"
      ? "Macintosh; Intel Mac OS X 10_15_7"
      : process.platform === "win32"
      ? "Windows NT 10.0; Win64; x64"
      : "X11; Linux x86_64";
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
}

function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: true,
    backgroundColor: "#0a0a0f",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      spellcheck: true,
    },
  });

  // The Nexus UI itself should never spawn OS windows; send real external
  // links to the user's default browser instead.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:\/\//i.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(url);

  // Keep the native browser overlay aligned when the OS window changes.
  const relayout = () => browserViews && browserViews.setBounds(browserViews.bounds);
  mainWindow.on("resize", relayout);
  mainWindow.on("enter-full-screen", relayout);
  mainWindow.on("leave-full-screen", relayout);

  mainWindow.on("closed", () => {
    if (browserViews) browserViews.destroyAll();
    browserViews = null;
    mainWindow = null;
  });
}

async function bootstrap() {
  const { url, child } = await startNextServer();
  nextChild = child;

  // Dedicated, persistent session for browsed sites — isolated from the app's
  // own session but durable across restarts (cookies, logins, storage).
  const browsing = session.fromPartition(BROWSING_PARTITION, { cache: true });
  browsing.setUserAgent(chromeUserAgent());

  const getRendererWC = () =>
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;

  installPermissionHandlers(browsing, getRendererWC);
  const downloads = installDownloadHandlers(browsing, getRendererWC);

  createMainWindow(url);

  browserViews = new BrowserViews({
    getWindow: () => mainWindow,
    session: browsing,
  });

  registerIpcHandlers({ views: browserViews, downloads });
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && browserViews === null) {
    bootstrap();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (browserViews) browserViews.destroyAll();
  if (nextChild && !nextChild.killed) {
    try {
      nextChild.kill();
    } catch {
      /* ignore */
    }
  }
});
