"use client";

import type { OnMount } from "@monaco-editor/react";
import { Code2, Command } from "lucide-react";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import EditorTabs from "./EditorTabs";
import Breadcrumbs from "./Breadcrumbs";
import EditorPane from "./EditorPane";

type MonacoEditor = Parameters<OnMount>[0];

/** Center column: tab strip, breadcrumbs, and the active editor (or welcome). */
export default function EditorArea({
  editorRef,
}: {
  editorRef: React.MutableRefObject<MonacoEditor | null>;
}) {
  const activeTabId = useCodeStudioStore((s) => s.activeTabId);
  const node = useCodeStudioStore((s) => s.getNode(activeTabId));
  const openTabIds = useCodeStudioStore((s) => s.openTabIds);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg/20">
      {openTabIds.length > 0 && <EditorTabs />}
      {node && node.kind === "file" ? (
        <>
          <Breadcrumbs nodeId={node.id} />
          <EditorPane node={node} editorRef={editorRef} />
        </>
      ) : (
        <Welcome />
      )}
    </div>
  );
}

function Welcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="accent-gradient flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
        <Code2 className="h-7 w-7 text-black/80" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text">Nexus Code Studio</h2>
        <p className="mt-1 text-sm text-muted">
          Open a file from the explorer, or create a new one to start coding.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted">
        <Shortcut keys="Ctrl / ⌘ + Shift + P" label="Command palette" />
        <Shortcut keys="Ctrl / ⌘ + B" label="Toggle sidebar" />
        <Shortcut keys="Ctrl / ⌘ + `" label="Toggle panel" />
        <Shortcut keys="Ctrl / ⌘ + Enter" label="Run preview" />
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Command className="h-3 w-3 opacity-60" />
      <span className="w-40 text-right text-muted/70">{label}</span>
      <kbd className="rounded border border-border/15 bg-glass/50 px-1.5 py-0.5 font-mono text-[10.5px] text-text/80">
        {keys}
      </kbd>
    </div>
  );
}
