# Nexus OS — Electron shell (real Chromium browser)

The Nexus **Browser** app uses a real Chromium engine (Electron `WebContentsView`)
instead of an `<iframe>`, so it can load any site with working logins, cookies,
downloads, permissions, DevTools, etc. Everything else in Nexus OS is unchanged.

When Nexus is served on the **web** (plain `next dev` / `next start` in a browser),
the Browser automatically falls back to the previous iframe behaviour — there is
no way to embed arbitrary cross-origin sites from a normal web page.

## Install

```bash
npm install
```

This pulls in `electron`, `concurrently`, `wait-on`, `cross-env`,
`electron-builder` (all devDependencies).

## Run in development

```bash
npm run electron:dev
```

This starts `next dev` and, once `http://localhost:3000` is up, launches Electron
pointing at it. Edit React as usual — hot reload works. Edit files under
`electron/` → restart the command.

## Run the production build locally

```bash
npm run electron:build     # next build
npm run electron:start     # spawns `next start` and opens Electron
```

## Architecture

```
electron/
  main/
    index.js         app lifecycle, main window, sessions, wiring
    next-server.js   waits for (dev) or spawns (prod) the Next server
    browser-views.js WebContentsView-per-tab engine (nav, menu, zoom, fullscreen, pdf)
    permissions.js   camera / mic / geolocation / clipboard / notifications
    downloads.js     progress / pause / resume / cancel / reveal
  ipc/
    channels.js      channel-name registry
    handlers.js      ipcMain routing (the trust boundary)
  preload/
    index.js         contextBridge -> window.nexusBrowser (no Node exposed)

src/
  lib/nexusBridge.ts                 typed bridge + isElectron()
  features/browser/
    useNativeBrowser.ts              store <-> engine bridge (no-op on web)
    NativeViewport.tsx               placeholder + bounds/visibility sync
    Viewport.tsx                     branches native (Electron) vs iframe (web)
```

### Security

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` everywhere.
- The Nexus UI window gets the preload bridge; browsed sites get **no** preload.
- Browsed sites run on an isolated, persistent session (`persist:nexus-web`).
- All IPC goes through the whitelisted channels in `electron/ipc/handlers.js`.

## Assumptions & limits

- **One Browser window.** Tabs live in a single global store, so the native
  engine is designed for one open Browser window at a time. Opening a second
  Browser window would share the same tabs; independent windows would require
  per-window tab state (a separate change).
- **Z-order.** A native view always paints above HTML, so the Browser hides its
  view while a side panel / overflow menu / address dropdown is open, on a load
  error, or when another Nexus window overlaps it with a higher z-index.
- **Packaging an installer** (`npm run dist`) for an SSR Next.js app is advanced:
  the Node server + `node_modules` must ship with the app (e.g. via Next
  `output: "standalone"`). The `build` block in `package.json` is a starting
  point, not a turnkey installer.
```
