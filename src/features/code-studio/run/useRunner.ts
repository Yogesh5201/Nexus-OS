"use client";

import { useEffect, useRef } from "react";
import { useCodeStudioStore } from "../store/useCodeStudioStore";
import { languageOf } from "../data/languages";
import { htmlEntry } from "../components/preview/buildSrcDoc";
import { runtimeForFile } from "../runtimes";
import type { RunEvent, RunHandle } from "../runtimes/types";

/**
 * Central run manager. On `nexus:cs-run` it decides how to execute the current
 * workspace and dispatches accordingly:
 *   - active file is Python  → Pyodide runtime
 *   - project has index.html → live web preview (`nexus:cs-run-web`)
 *   - active file is JS/TS   → JS worker runtime
 *   - otherwise              → a note in the console
 * Runtime output streams into the store (Console panel + status bar).
 */
export function useRunner() {
  const handleRef = useRef<RunHandle | null>(null);

  useEffect(() => {
    const execute = (code: string, runtime: NonNullable<ReturnType<typeof runtimeForFile>>) => {
      const s = useCodeStudioStore.getState();
      handleRef.current?.cancel();
      s.clearLogs();
      s.setPanelTab("console");
      s.setPanelOpen(true);
      s.setRunState("running");

      const emit = (e: RunEvent) => {
        const store = useCodeStudioStore.getState();
        if (e.kind === "log") store.pushLog(e.level, e.text);
        else if (e.kind === "status")
          store.setRunState(e.state === "running" ? "running" : e.state === "error" ? "error" : "idle");
      };
      handleRef.current = runtime.run(code, emit);
    };

    const onRun = () => {
      const s = useCodeStudioStore.getState();
      const active = s.getNode(s.activeTabId);
      const hasWeb = htmlEntry(s.nodes) !== null;
      const lang = active ? languageOf(active.name) : null;

      // 1. Python always runs standalone.
      if (active && lang === "python") {
        const rt = runtimeForFile(active.name);
        if (rt) return execute(active.content ?? "", rt);
      }
      // 2. Web projects refresh the live preview.
      if (hasWeb) {
        window.dispatchEvent(new Event("nexus:cs-run-web"));
        return;
      }
      // 3. Standalone JS/TS.
      if (active) {
        const rt = runtimeForFile(active.name);
        if (rt) return execute(active.content ?? "", rt);
      }
      // 4. Nothing to run.
      s.setPanelTab("console");
      s.setPanelOpen(true);
      s.pushLog("info", "Nothing to run — open a script (.py/.js/.ts) or add an index.html.");
    };

    window.addEventListener("nexus:cs-run", onRun);
    return () => {
      window.removeEventListener("nexus:cs-run", onRun);
      handleRef.current?.cancel();
    };
  }, []);
}
