/**
 * Runtime registry — picks the real execution engine for a file.
 * Web (HTML/CSS/JS projects) is handled separately by the live iframe preview.
 */
import { extOf, languageOf } from "../data/languages";
import { jsRuntime } from "./jsRuntime";
import { pythonRuntime } from "./pythonRuntime";
import type { Runtime } from "./types";

const JS_EXTS = new Set(["js", "mjs", "cjs", "ts", "tsx", "jsx"]);

/** The runtime that can execute this file standalone, or null if none. */
export function runtimeForFile(name: string): Runtime | null {
  if (languageOf(name) === "python") return pythonRuntime();
  const ext = extOf(name);
  if (JS_EXTS.has(ext)) return jsRuntime(ext);
  return null;
}

/** Whether a file can be executed by a standalone runtime. */
export function isRunnable(name: string): boolean {
  return runtimeForFile(name) !== null;
}

export type { Runtime, RunEvent, RunHandle } from "./types";
