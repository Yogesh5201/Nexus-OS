"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import type { LogLevel } from "../../types";
import { buildSrcDoc } from "./buildSrcDoc";

/**
 * Live HTML/CSS/JS preview in a sandboxed iframe. Pipes the page's console back
 * to the store, auto-runs (debounced) on change, and refreshes on
 * `nexus:cs-run-web` (dispatched by the run manager for web projects).
 */
export default function WebPreview() {
  const nodes = useCodeStudioStore((s) => s.nodes);
  const autoRun = useCodeStudioStore((s) => s.prefs.autoRun);
  const pushLog = useCodeStudioStore((s) => s.pushLog);
  const clearLogs = useCodeStudioStore((s) => s.clearLogs);
  const setRunState = useCodeStudioStore((s) => s.setRunState);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const run = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const doc = buildSrcDoc(useCodeStudioStore.getState().nodes);
    if (doc === null) return;
    clearLogs();
    setRunState("running");
    frame.srcdoc = doc;
  }, [clearLogs, setRunState]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.__nexus) {
        const level = (e.data.type as LogLevel) ?? "log";
        pushLog(level, String(e.data.msg ?? ""));
        if (level === "error") setRunState("error");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushLog, setRunState]);

  useEffect(() => {
    const onRun = () => run();
    window.addEventListener("nexus:cs-run-web", onRun);
    return () => window.removeEventListener("nexus:cs-run-web", onRun);
  }, [run]);

  useEffect(() => {
    if (!autoRun) return;
    const t = setTimeout(run, 500);
    return () => clearTimeout(t);
  }, [nodes, autoRun, run]);

  return (
    <iframe
      ref={iframeRef}
      title="Live preview"
      sandbox="allow-scripts allow-modals"
      className="h-full w-full bg-white"
      onLoad={() => {
        if (useCodeStudioStore.getState().runState === "running") setRunState("idle");
      }}
    />
  );
}
