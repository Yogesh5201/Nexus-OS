"use client";

import { useMemo } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { AppSkeleton } from "@/components/shell/AppSkeleton";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import { languageOf } from "../../data/languages";
import { configureMonaco, editorOptions } from "../../monaco/setup";
import { themeName } from "../../monaco/theme";
import type { VNode } from "../../types";

type MonacoEditor = Parameters<OnMount>[0];

/** Monaco editor bound to a single workspace file. */
export default function EditorPane({
  node,
  editorRef,
}: {
  node: VNode;
  editorRef: React.MutableRefObject<MonacoEditor | null>;
}) {
  const setContent = useCodeStudioStore((s) => s.setContent);
  const setCursor = useCodeStudioStore((s) => s.setCursor);
  const prefs = useCodeStudioStore((s) => s.prefs);
  const theme = useSettingsStore((s) => s.theme);

  const path = useCodeStudioStore((s) =>
    s.pathTo(node.id).map((n) => n.name).join("/")
  );
  const language = languageOf(node.name);
  const options = useMemo(
    () => editorOptions({ fontSize: prefs.fontSize, minimap: prefs.minimap, wordWrap: prefs.wordWrap }),
    [prefs.fontSize, prefs.minimap, prefs.wordWrap]
  );

  const beforeMount = (monaco: Monaco) => configureMonaco(monaco);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    const report = () => {
      const pos = editor.getPosition();
      const sel = editor.getSelection();
      const selected = sel ? editor.getModel()?.getValueInRange(sel).length ?? 0 : 0;
      if (pos) setCursor({ line: pos.lineNumber, column: pos.column, selected });
    };
    report();
    editor.onDidChangeCursorPosition(report);
    editor.onDidChangeCursorSelection(report);
  };

  return (
    <Editor
      key={node.id}
      className="min-h-0 flex-1"
      path={path || node.name}
      language={language}
      theme={themeName(theme)}
      value={node.content ?? ""}
      loading={<AppSkeleton />}
      beforeMount={beforeMount}
      onMount={onMount}
      onChange={(v) => setContent(node.id, v ?? "")}
      options={options}
    />
  );
}
