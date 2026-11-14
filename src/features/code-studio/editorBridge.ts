/**
 * Editor bridge — a tiny singleton so components outside the editor subtree
 * (e.g. the AI panel in the sidebar) can read the current selection and apply
 * AI-generated edits without prop-drilling the Monaco instance everywhere.
 *
 * EditorPane registers the active editor on mount; readers use the getters.
 */
import type { OnMount } from "@monaco-editor/react";

type Ed = Parameters<OnMount>[0];

let editor: Ed | null = null;

export function registerEditor(e: Ed | null): void {
  editor = e;
}

/** Currently selected text, or "" when there's no selection / no editor. */
export function getSelectedText(): string {
  if (!editor) return "";
  const sel = editor.getSelection();
  const model = editor.getModel();
  return sel && model ? model.getValueInRange(sel) : "";
}

/** Full text of the active editor. */
export function getFullText(): string {
  return editor?.getValue() ?? "";
}

/** True when there's a non-empty selection. */
export function hasSelection(): boolean {
  const sel = editor?.getSelection();
  return !!sel && !sel.isEmpty();
}

/** The code the AI should operate on: the selection if any, else the whole file. */
export function getContextCode(): { code: string; fromSelection: boolean } {
  const sel = getSelectedText();
  if (sel.trim()) return { code: sel, fromSelection: true };
  return { code: getFullText(), fromSelection: false };
}

/**
 * Apply AI-generated code: replace the selection if there is one, otherwise
 * replace the whole document. Editor edits flow back into the store via the
 * editor's onChange, so persistence stays consistent.
 */
export function applyCode(code: string): boolean {
  if (!editor) return false;
  const model = editor.getModel();
  if (!model) return false;
  const sel = editor.getSelection();
  if (sel && !sel.isEmpty()) {
    editor.executeEdits("nexus-ai", [{ range: sel, text: code, forceMoveMarkers: true }]);
  } else {
    model.setValue(code);
  }
  editor.focus();
  return true;
}
