// electron/main/browser-views.js
//
// The real browser engine. Each Nexus tab gets its own native WebContentsView
// (a full Chromium page) on a shared *persistent* session, so cookies, logins,
// localStorage and sessionStorage all survive. Views are layered over the Nexus
// UI and positioned to match a placeholder <div> in the Browser app; only the
// active tab is visible at a time.

const { WebContentsView, Menu, dialog } = require("electron");
const path = require("path");
const { CH } = require("../ipc/channels");

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;

function round(r) {
  return {
    x: Math.round(r.x || 0),
    y: Math.round(r.y || 0),
    width: Math.max(0, Math.round(r.width || 0)),
    height: Math.max(0, Math.round(r.height || 0)),
  };
}

class BrowserViews {
  /**
   * @param {object} opts
   * @param {() => Electron.BrowserWindow | null} opts.getWindow
   * @param {Electron.Session} opts.session  persistent browsing session
   */
  constructor({ getWindow, session }) {
    this.getWindow = getWindow;
    this.session = session;

    /** @type {Map<string, Electron.WebContentsView>} */
    this.views = new Map();
    this.activeTabId = null;
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
    this.visible = false;
    this.fullscreenTabId = null;
  }

  // ------------------------------------------------------------------ helpers
  _rendererWC() {
    const win = this.getWindow();
    return win && !win.isDestroyed() ? win.webContents : null;
  }

  _emit(channel, payload) {
    const wc = this._rendererWC();
    if (wc) wc.send(channel, payload);
  }

  _state(tabId, wc, extra = {}) {
    return {
      tabId,
      url: wc.getURL(),
      title: wc.getTitle(),
      canGoBack: wc.canGoBack(),
      canGoForward: wc.canGoForward(),
      loading: wc.isLoadingMainFrame(),
      ...extra,
    };
  }

  // ------------------------------------------------------------- view lifecycle
  ensure(tabId) {
    let view = this.views.get(tabId);
    if (view) return view;

    view = new WebContentsView({
      webPreferences: {
        session: this.session,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        webviewTag: false,
        backgroundThrottling: false,
        spellcheck: true,
        // No preload here — this hosts arbitrary, untrusted web content.
      },
    });

    const win = this.getWindow();
    if (win) win.contentView.addChildView(view);
    view.setVisible(false);

    this._wire(tabId, view);
    this.views.set(tabId, view);
    return view;
  }

  _wire(tabId, view) {
    const wc = view.webContents;
    const push = (extra) => this._emit(CH.EVT_TAB_UPDATE, this._state(tabId, wc, extra));

    wc.on("did-start-loading", () => push({ loading: true }));
    wc.on("did-stop-loading", () => push({ loading: false }));
    wc.on("page-title-updated", (_e, title) => push({ title }));
    wc.on("did-navigate", () => push());
    wc.on("did-navigate-in-page", () => push());
    wc.on("did-frame-navigate", () => push());
    wc.on("page-favicon-updated", (_e, favicons) => {
      const favicon = favicons && favicons.length ? favicons[favicons.length - 1] : "";
      this._emit(CH.EVT_TAB_UPDATE, { tabId, favicon });
    });
    wc.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
      if (isMainFrame && code !== -3) {
        this._emit(CH.EVT_TAB_UPDATE, {
          tabId,
          loading: false,
          failed: { code, desc, url },
        });
      }
    });

    // window.open / target=_blank / middle-click -> open as a Nexus tab.
    wc.setWindowOpenHandler(({ url }) => {
      if (url && url !== "about:blank") this._emit(CH.EVT_NEW_TAB, { url });
      return { action: "deny" };
    });

    // HTML fullscreen (video players etc.).
    wc.on("enter-html-full-screen", () => {
      this.fullscreenTabId = tabId;
      this._applyLayout();
      this._emit(CH.EVT_FULLSCREEN, { tabId, active: true });
    });
    wc.on("leave-html-full-screen", () => {
      if (this.fullscreenTabId === tabId) this.fullscreenTabId = null;
      this._applyLayout();
      this._emit(CH.EVT_FULLSCREEN, { tabId, active: false });
    });

    // Keyboard: DevTools + zoom (navigation stays with the Nexus toolbar).
    wc.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown") return;
      const mod = input.control || input.meta;
      const key = (input.key || "").toLowerCase();
      if (key === "f12" || (mod && input.shift && key === "i")) {
        this.openDevTools(tabId);
        event.preventDefault();
      } else if (mod && (key === "=" || key === "+")) {
        this._nudgeZoom(wc, +0.1);
        event.preventDefault();
      } else if (mod && key === "-") {
        this._nudgeZoom(wc, -0.1);
        event.preventDefault();
      } else if (mod && key === "0") {
        wc.setZoomFactor(1);
        event.preventDefault();
      }
    });

    wc.on("context-menu", (_e, params) => this._contextMenu(tabId, wc, params));
  }

  _nudgeZoom(wc, delta) {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, wc.getZoomFactor() + delta));
    wc.setZoomFactor(next);
  }

  _contextMenu(tabId, wc, params) {
    const win = this.getWindow();
    if (!win) return;
    const t = [];
    const has = (s) => s && s.length > 0;

    t.push({ label: "Back", enabled: wc.canGoBack(), click: () => wc.goBack() });
    t.push({ label: "Forward", enabled: wc.canGoForward(), click: () => wc.goForward() });
    t.push({ label: "Reload", click: () => wc.reload() });
    t.push({ type: "separator" });

    if (has(params.linkURL)) {
      t.push({
        label: "Open Link in New Tab",
        click: () => this._emit(CH.EVT_NEW_TAB, { url: params.linkURL }),
      });
      t.push({
        label: "Copy Link Address",
        click: () => require("electron").clipboard.writeText(params.linkURL),
      });
      t.push({ type: "separator" });
    }

    if (params.mediaType === "image" && has(params.srcURL)) {
      t.push({
        label: "Open Image in New Tab",
        click: () => this._emit(CH.EVT_NEW_TAB, { url: params.srcURL }),
      });
      t.push({ label: "Save Image As…", click: () => wc.downloadURL(params.srcURL) });
      t.push({ type: "separator" });
    }

    if (params.isEditable) {
      t.push({ role: "cut", enabled: params.editFlags.canCut });
      t.push({ role: "copy", enabled: params.editFlags.canCopy });
      t.push({ role: "paste", enabled: params.editFlags.canPaste });
      t.push({ role: "selectAll" });
    } else if (has(params.selectionText)) {
      t.push({ role: "copy" });
      t.push({
        label: "Search the web",
        click: () =>
          this._emit(CH.EVT_NEW_TAB, {
            url: `https://duckduckgo.com/?q=${encodeURIComponent(params.selectionText)}`,
          }),
      });
    }

    t.push({ type: "separator" });
    t.push({
      label: "Inspect Element",
      click: () => {
        wc.inspectElement(params.x, params.y);
        if (wc.isDevToolsOpened()) wc.devToolsWebContents?.focus();
      },
    });

    Menu.buildFromTemplate(t).popup({ window: win });
  }

  // -------------------------------------------------------------- layout / show
  /** Compute the bounds the active view should occupy right now. */
  _targetBounds() {
    if (this.fullscreenTabId) {
      const win = this.getWindow();
      if (win) {
        const [w, h] = win.getContentSize();
        return { x: 0, y: 0, width: w, height: h };
      }
    }
    return this.bounds;
  }

  _applyLayout() {
    for (const [tabId, view] of this.views) {
      const isActive = tabId === this.activeTabId;
      const show = isActive && (this.visible || this.fullscreenTabId === tabId);
      view.setVisible(show);
      if (show) view.setBounds(round(this._targetBounds()));
    }
  }

  setBounds(rect) {
    this.bounds = rect;
    this._applyLayout();
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    this._applyLayout();
  }

  setActive(tabId) {
    this.activeTabId = tabId;
    const view = this.ensure(tabId);
    // Re-stack the active view above its siblings.
    const win = this.getWindow();
    if (win) {
      win.contentView.removeChildView(view);
      win.contentView.addChildView(view);
    }
    this._applyLayout();
  }

  // ---------------------------------------------------------------- navigation
  navigate(tabId, url) {
    const view = this.ensure(tabId);
    if (!url) return;
    view.webContents.loadURL(url).catch(() => {
      /* did-fail-load already reports this to the renderer */
    });
  }

  back(tabId) {
    const v = this.views.get(tabId);
    if (v && v.webContents.canGoBack()) v.webContents.goBack();
  }

  forward(tabId) {
    const v = this.views.get(tabId);
    if (v && v.webContents.canGoForward()) v.webContents.goForward();
  }

  reload(tabId, ignoreCache = false) {
    const v = this.views.get(tabId);
    if (!v) return;
    if (ignoreCache) v.webContents.reloadIgnoringCache();
    else v.webContents.reload();
  }

  stop(tabId) {
    const v = this.views.get(tabId);
    if (v) v.webContents.stop();
  }

  setZoom(tabId, factor) {
    const v = this.views.get(tabId);
    if (v) v.webContents.setZoomFactor(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor)));
  }

  openDevTools(tabId) {
    const v = this.views.get(tabId);
    if (v) v.webContents.openDevTools({ mode: "detach" });
  }

  find(tabId, text, options = {}) {
    const v = this.views.get(tabId);
    if (v && text) v.webContents.findInPage(text, options);
  }

  stopFind(tabId) {
    const v = this.views.get(tabId);
    if (v) v.webContents.stopFindInPage("clearSelection");
  }

  async savePdf(tabId) {
    const v = this.views.get(tabId);
    const win = this.getWindow();
    if (!v || !win) return { ok: false };
    try {
      const data = await v.webContents.printToPDF({ printBackground: true });
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        defaultPath: "page.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (canceled || !filePath) return { ok: false };
      require("fs").writeFileSync(filePath, data);
      return { ok: true, filePath };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  // ------------------------------------------------------------------- teardown
  close(tabId) {
    const view = this.views.get(tabId);
    if (!view) return;
    const win = this.getWindow();
    if (win) win.contentView.removeChildView(view);
    try {
      view.webContents.close();
    } catch {
      /* already gone */
    }
    this.views.delete(tabId);
    if (this.activeTabId === tabId) this.activeTabId = null;
    if (this.fullscreenTabId === tabId) this.fullscreenTabId = null;
  }

  destroyAll() {
    for (const tabId of [...this.views.keys()]) this.close(tabId);
  }
}

module.exports = { BrowserViews };
