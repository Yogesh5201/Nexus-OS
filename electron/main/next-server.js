// electron/main/next-server.js
//
// Nexus OS is a server-rendered Next.js app (server components, MongoDB,
// firebase-admin) so it cannot be a static file:// bundle — Electron must load
// it from a running Next server.
//
//   • dev  : NEXT_URL points at the `next dev` server you already run.
//   • prod : we spawn `next start` as a child process and wait for the port.

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";

/** Resolve the URL Electron should load, given the run mode. */
function targetUrl(port = DEFAULT_PORT) {
  return process.env.NEXT_URL || `http://${HOST}:${port}`;
}

/** Poll an HTTP endpoint until it answers (or we run out of tries). */
function waitForServer(url, { timeoutMs = 60000, intervalMs = 400 } = {}) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`Next server did not start at ${url}`));
        } else {
          setTimeout(attempt, intervalMs);
        }
      });
    };
    attempt();
  });
}

/**
 * Ensure a Next server is reachable and return its URL.
 * Returns { url, child } — `child` is the spawned process (prod) or null (dev).
 */
async function startNextServer() {
  const isDev = !require("electron").app.isPackaged;
  const url = targetUrl();

  // Dev (or an externally-managed server): just wait for it to be up.
  if (isDev || process.env.NEXT_URL) {
    await waitForServer(url);
    return { url, child: null };
  }

  // Production: launch `next start` ourselves from the app directory.
  const projectRoot = path.join(__dirname, "..", "..");
  const nextBin = path.join(
    projectRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  const child = spawn(process.execPath, [nextBin, "start", "-p", String(DEFAULT_PORT)], {
    cwd: projectRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", PORT: String(DEFAULT_PORT) },
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[nexus] next start exited with code ${code}`);
    }
  });

  await waitForServer(url);
  return { url, child };
}

module.exports = { startNextServer, targetUrl };
