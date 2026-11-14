/**
 * JavaScript / TypeScript runtime.
 *
 * TypeScript/JSX is transpiled with sucrase (types stripped — no type-check),
 * then executed for real inside a sandboxed Web Worker with console output
 * piped back. A watchdog terminates runaway code. This is browser-JS execution
 * (no Node/`require`/`fs`); real Node arrives with WebContainers in a later phase.
 */
import { transform } from "sucrase";
import type { Runtime, RunEvent, RunHandle } from "./types";

const TIMEOUT_MS = 10_000;

// The worker: capture console, eval the code in global scope, report status.
const WORKER_SRC = `
var fmt = function (a) { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch (e) { return String(a); } };
var send = function (level, args) { self.postMessage({ __cs: true, kind: 'log', level: level, text: [].map.call(args, fmt).join(' ') }); };
var status = function (state) { self.postMessage({ __cs: true, kind: 'status', state: state }); };
['log', 'info', 'warn', 'error', 'debug'].forEach(function (k) { console[k] = function () { send(k, arguments); }; });
self.addEventListener('unhandledrejection', function (e) { send('error', ['Unhandled rejection: ' + ((e.reason && e.reason.message) || e.reason)]); status('error'); });
self.onmessage = function (e) {
  try { (0, eval)(e.data.code); status('done'); }
  catch (err) { send('error', [(err && err.stack) || String(err)]); status('error'); }
};
`;

function transformsFor(ext: string): ("typescript" | "jsx")[] {
  switch (ext) {
    case "ts":
      return ["typescript"];
    case "tsx":
      return ["typescript", "jsx"];
    case "jsx":
      return ["jsx"];
    default:
      return [];
  }
}

/** Build a JS/TS runtime for a given file extension (ts/tsx/jsx/js/mjs/cjs). */
export function jsRuntime(ext: string): Runtime {
  return {
    label: "JavaScript",
    run(code, emit) {
      emit({ kind: "status", state: "running" });

      // Transpile away TS/JSX syntax first.
      let js = code;
      const transforms = transformsFor(ext);
      if (transforms.length) {
        try {
          js = transform(code, { transforms, production: true }).code;
        } catch (err) {
          emit({ kind: "log", level: "error", text: String((err as Error).message ?? err) });
          emit({ kind: "status", state: "error" });
          return { cancel: () => {} };
        }
      }

      const url = URL.createObjectURL(
        new Blob([WORKER_SRC], { type: "text/javascript" })
      );
      const worker = new Worker(url);
      let disposed = false;
      let graceTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (disposed) return;
        disposed = true;
        clearTimeout(timer);
        if (graceTimer) clearTimeout(graceTimer);
        worker.terminate();
        URL.revokeObjectURL(url);
      };

      const timer = setTimeout(() => {
        emit({ kind: "log", level: "error", text: `Execution timed out (${TIMEOUT_MS / 1000}s)` });
        emit({ kind: "status", state: "error" });
        cleanup();
      }, TIMEOUT_MS);

      worker.onmessage = (e: MessageEvent) => {
        const d = e.data;
        if (!d?.__cs) return;
        if (d.kind === "log") {
          emit({ kind: "log", level: d.level, text: d.text } as RunEvent);
        } else if (d.kind === "status") {
          emit({ kind: "status", state: d.state } as RunEvent);
          if (d.state === "error") {
            cleanup();
          } else if (d.state === "done") {
            // Stop the watchdog, but keep the worker alive a short grace period
            // so pending async callbacks (timers) can still log before teardown.
            clearTimeout(timer);
            graceTimer = setTimeout(cleanup, 3000);
          }
        }
      };
      worker.onerror = (e) => {
        emit({ kind: "log", level: "error", text: e.message });
        emit({ kind: "status", state: "error" });
        cleanup();
      };

      worker.postMessage({ code: js });

      return { cancel: cleanup };
    },
  };
}
