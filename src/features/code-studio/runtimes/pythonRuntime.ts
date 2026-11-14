/**
 * Python runtime — real CPython compiled to WebAssembly via Pyodide.
 *
 * Pyodide is loaded from the jsDelivr CDN inside a persistent Web Worker (so the
 * ~10MB runtime downloads/initialises once, then stays warm). stdout/stderr are
 * streamed back as console output. `input()` and heavy native packages are out
 * of scope for this phase.
 */
import type { Runtime, RunEvent, RunHandle } from "./types";

const PYODIDE_VERSION = "0.26.2";
const WATCHDOG_MS = 30_000;

const WORKER_SRC = `
var ready = null;
function ensure() {
  if (!ready) {
    self.postMessage({ __cs: true, kind: 'log', level: 'info', text: 'Loading Python runtime (Pyodide)…' });
    importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js');
    ready = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/' }).then(function (py) {
      py.setStdout({ batched: function (s) { self.postMessage({ __cs: true, kind: 'log', level: 'log', text: s }); } });
      py.setStderr({ batched: function (s) { self.postMessage({ __cs: true, kind: 'log', level: 'error', text: s }); } });
      self.postMessage({ __cs: true, kind: 'log', level: 'info', text: 'Python ready.' });
      return py;
    });
  }
  return ready;
}
self.onmessage = function (e) {
  var code = e.data.code;
  ensure().then(function (py) {
    self.postMessage({ __cs: true, kind: 'status', state: 'running' });
    return py.runPythonAsync(code).then(function () {
      self.postMessage({ __cs: true, kind: 'status', state: 'done' });
    });
  }).catch(function (err) {
    self.postMessage({ __cs: true, kind: 'log', level: 'error', text: (err && err.message) || String(err) });
    self.postMessage({ __cs: true, kind: 'status', state: 'error' });
  });
};
`;

// Persistent worker so Pyodide only initialises once per session.
let worker: Worker | null = null;
let workerUrl: string | null = null;
let currentEmit: ((e: RunEvent) => void) | null = null;

function getWorker(): Worker {
  if (worker) return worker;
  workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  worker = new Worker(workerUrl);
  worker.onmessage = (e: MessageEvent) => {
    const d = e.data;
    if (!d?.__cs || !currentEmit) return;
    if (d.kind === "log") currentEmit({ kind: "log", level: d.level, text: d.text });
    else if (d.kind === "status") currentEmit({ kind: "status", state: d.state });
  };
  return worker;
}

function disposeWorker() {
  worker?.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = null;
  currentEmit = null;
}

export function pythonRuntime(): Runtime {
  return {
    label: "Python (Pyodide)",
    run(code, emit): RunHandle {
      currentEmit = emit;
      emit({ kind: "status", state: "running" });

      let finished = false;
      const finish = () => {
        finished = true;
        clearTimeout(timer);
      };

      // Route status terminals through a wrapper so we can stop the watchdog.
      const routed = (e: RunEvent) => {
        emit(e);
        if (e.kind === "status" && (e.state === "done" || e.state === "error")) finish();
      };
      currentEmit = routed;

      const timer = setTimeout(() => {
        if (finished) return;
        emit({ kind: "log", level: "error", text: `Python execution timed out (${WATCHDOG_MS / 1000}s) — worker reset.` });
        emit({ kind: "status", state: "error" });
        disposeWorker();
      }, WATCHDOG_MS);

      getWorker().postMessage({ code });

      return {
        cancel: () => {
          if (finished) return;
          finish();
          emit({ kind: "status", state: "error" });
          disposeWorker();
        },
      };
    },
  };
}
