"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "./store/useCodeStudioStore";
import { useResizable } from "./hooks/useResizable";
import { useCodeStudioHotkeys } from "./hooks/useCodeStudioHotkeys";
import { useRunner } from "./run/useRunner";
import { buildCommands, type CommandContext } from "./commands";
import ActivityBar from "./components/ActivityBar";
import Sidebar from "./components/Sidebar";
import EditorArea from "./components/editor/EditorArea";
import PreviewPanel from "./components/preview/PreviewPanel";
import BottomPanel from "./components/panel/BottomPanel";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";

type MonacoEditor = Parameters<OnMount>[0];

/**
 * Code Studio — a modular, VS Code-style IDE embedded in Nexus.
 *
 * Layout: activity bar | sidebar | (editor + live preview) over a bottom panel,
 * with a status bar and an editor-scoped command palette. All workspace state
 * lives in `useCodeStudioStore` (autosaved to localStorage).
 */
export default function CodeStudio() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const sidebarOpen = useCodeStudioStore((s) => s.sidebarOpen);
  const sidebarWidth = useCodeStudioStore((s) => s.sidebarWidth);
  const panelOpen = useCodeStudioStore((s) => s.panelOpen);
  const panelHeight = useCodeStudioStore((s) => s.panelHeight);
  const previewOpen = useCodeStudioStore((s) => s.previewOpen);
  const previewSplit = useCodeStudioStore((s) => s.previewSplit);

  // ---- resizable handles --------------------------------------------------
  const sidebarResize = useResizable({
    axis: "x",
    getValue: () => useCodeStudioStore.getState().sidebarWidth,
    setValue: (v) => useCodeStudioStore.getState().setSidebarWidth(v),
    sign: 1,
  });
  const panelResize = useResizable({
    axis: "y",
    getValue: () => useCodeStudioStore.getState().panelHeight,
    setValue: (v) => useCodeStudioStore.getState().setPanelHeight(v),
    sign: -1,
  });

  const onPreviewDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const fraction = 1 - (ev.clientX - rect.left) / rect.width;
      useCodeStudioStore.getState().setPreviewSplit(fraction);
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  // ---- commands + hotkeys -------------------------------------------------
  const ctx = useMemo<CommandContext>(
    () => ({
      runPreview: () => {
        useCodeStudioStore.getState().setPreviewOpen(true);
        // Give a freshly-mounted preview time to register its listener.
        setTimeout(() => window.dispatchEvent(new Event("nexus:cs-run")), 60);
      },
      openPalette: () => setPaletteOpen(true),
      formatDocument: () =>
        editorRef.current?.getAction("editor.action.formatDocument")?.run(),
      save: () => window.dispatchEvent(new Event("nexus:cs-saved")),
    }),
    []
  );
  const commands = useMemo(() => buildCommands(ctx), [ctx]);
  useCodeStudioHotkeys(rootRef, commands);
  useRunner();

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-bg/60 text-text"
    >
      {/* Main row: activity bar | sidebar | editor column */}
      <div className="flex min-h-0 flex-1">
        <ActivityBar />

        {sidebarOpen && (
          <>
            <div
              className="min-h-0 shrink-0 overflow-hidden border-r border-border/10 bg-surface/30"
              style={{ width: sidebarWidth }}
            >
              <Sidebar />
            </div>
            <Divider orientation="x" onPointerDown={sidebarResize.onPointerDown} active={sidebarResize.dragging} />
          </>
        )}

        {/* Editor column: (editor + preview) over bottom panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={rowRef} className="flex min-h-0 min-w-0 flex-1">
            <div
              className="flex min-w-0 flex-col"
              style={{ flex: `${previewOpen ? 1 - previewSplit : 1} 1 0%` }}
            >
              <EditorArea editorRef={editorRef} />
            </div>

            {previewOpen && (
              <>
                <Divider orientation="x" onPointerDown={onPreviewDrag} active={false} />
                <div
                  className="min-w-0"
                  style={{ flex: `${previewSplit} 1 0%` }}
                >
                  <PreviewPanel />
                </div>
              </>
            )}
          </div>

          {panelOpen && (
            <>
              <Divider orientation="y" onPointerDown={panelResize.onPointerDown} active={panelResize.dragging} />
              <div className="min-h-0 shrink-0" style={{ height: panelHeight }}>
                <BottomPanel />
              </div>
            </>
          )}
        </div>
      </div>

      <StatusBar />

      <CommandPalette
        commands={commands}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}

/** A draggable divider between two panes. */
function Divider({
  orientation,
  onPointerDown,
  active,
}: {
  orientation: "x" | "y";
  onPointerDown: (e: React.PointerEvent) => void;
  active: boolean;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        "group relative z-10 shrink-0",
        orientation === "x" ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
      )}
    >
      <div
        className={cn(
          "bg-border/10 transition-colors group-hover:bg-accent/50",
          active && "bg-accent/70",
          orientation === "x"
            ? "absolute inset-y-0 -left-1 -right-1"
            : "absolute inset-x-0 -top-1 -bottom-1"
        )}
      />
    </div>
  );
}
