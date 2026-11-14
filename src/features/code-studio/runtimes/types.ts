/**
 * Code Studio — runtime abstraction.
 *
 * A Runtime executes a single source file for real (never simulated) and emits
 * a stream of events — console output plus a terminal status. Web (HTML/CSS/JS)
 * keeps its live iframe preview; these runtimes cover standalone scripts.
 */
import type { LogLevel } from "../types";

export type RunEvent =
  | { kind: "log"; level: LogLevel; text: string }
  | { kind: "status"; state: "running" | "done" | "error" };

export interface RunHandle {
  /** Stop execution early (terminates the worker). */
  cancel: () => void;
}

export interface Runtime {
  /** Human label, e.g. "Python (Pyodide)". */
  label: string;
  /**
   * Execute `code`, streaming events to `emit`. Returns a handle so the caller
   * can cancel a long-running / runaway program.
   */
  run: (code: string, emit: (e: RunEvent) => void) => RunHandle;
}
