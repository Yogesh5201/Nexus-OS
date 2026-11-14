/**
 * Code Studio — Monaco themes tuned to the Nexus palette.
 *
 * Two themes ("nexus-dark" / "nexus-light") derived from the app's design
 * tokens so the editor sits naturally on the glass window chrome and follows
 * the Settings light/dark toggle. Colours mirror globals.css:
 *   accent  = cyan  (56 189 248)   accent-2 = violet (167 139 250)
 *   success = green (52 211 153)    warning  = amber  (251 191 36)
 */
import type { Monaco } from "@monaco-editor/react";

let defined = false;

/** Register the Nexus themes once per Monaco instance. */
export function defineNexusThemes(monaco: Monaco): void {
  if (defined) return;
  defined = true;

  monaco.editor.defineTheme("nexus-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "edf0fc" },
      { token: "comment", foreground: "6b7394", fontStyle: "italic" },
      { token: "keyword", foreground: "a78bfa" },
      { token: "keyword.control", foreground: "a78bfa" },
      { token: "string", foreground: "34d399" },
      { token: "number", foreground: "fbbf24" },
      { token: "regexp", foreground: "fca5a5" },
      { token: "type", foreground: "7dd3fc" },
      { token: "type.identifier", foreground: "7dd3fc" },
      { token: "function", foreground: "38bdf8" },
      { token: "variable", foreground: "edf0fc" },
      { token: "variable.predefined", foreground: "f0abfc" },
      { token: "constant", foreground: "f0abfc" },
      { token: "operator", foreground: "94a0b8" },
      { token: "delimiter", foreground: "94a0b8" },
      { token: "tag", foreground: "38bdf8" },
      { token: "attribute.name", foreground: "a78bfa" },
      { token: "attribute.value", foreground: "34d399" },
      { token: "metatag", foreground: "6b7394" },
      { token: "key", foreground: "7dd3fc" },
    ],
    colors: {
      "editor.background": "#0b0f1a",
      "editor.foreground": "#edf0fc",
      "editorLineNumber.foreground": "#3a4256",
      "editorLineNumber.activeForeground": "#94a0b8",
      "editorCursor.foreground": "#38bdf8",
      "editor.selectionBackground": "#38bdf83a",
      "editor.inactiveSelectionBackground": "#38bdf822",
      "editor.lineHighlightBackground": "#ffffff08",
      "editor.lineHighlightBorder": "#00000000",
      "editorIndentGuide.background": "#ffffff10",
      "editorIndentGuide.activeBackground": "#ffffff24",
      "editorBracketMatch.background": "#38bdf825",
      "editorBracketMatch.border": "#38bdf880",
      "editorWhitespace.foreground": "#ffffff12",
      "editorGutter.background": "#0b0f1a",
      "editorWidget.background": "#141826",
      "editorWidget.border": "#ffffff14",
      "editorSuggestWidget.background": "#141826",
      "editorSuggestWidget.selectedBackground": "#38bdf825",
      "editorHoverWidget.background": "#141826",
      "input.background": "#0b0f1a",
      "scrollbarSlider.background": "#ffffff18",
      "scrollbarSlider.hoverBackground": "#ffffff2a",
      "scrollbarSlider.activeBackground": "#38bdf855",
      "minimap.background": "#0b0f1a",
    },
  });

  monaco.editor.defineTheme("nexus-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "12162a" },
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "keyword", foreground: "7c3aed" },
      { token: "string", foreground: "059669" },
      { token: "number", foreground: "b45309" },
      { token: "type", foreground: "0369a1" },
      { token: "function", foreground: "0284c7" },
      { token: "constant", foreground: "a21caf" },
      { token: "tag", foreground: "0284c7" },
      { token: "attribute.name", foreground: "7c3aed" },
      { token: "attribute.value", foreground: "059669" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#12162a",
      "editorLineNumber.foreground": "#b4bccb",
      "editorLineNumber.activeForeground": "#5a627c",
      "editorCursor.foreground": "#0284c7",
      "editor.selectionBackground": "#38bdf833",
      "editor.lineHighlightBackground": "#0a0e1e08",
      "editorBracketMatch.background": "#38bdf825",
      "editorBracketMatch.border": "#0284c780",
      "editorIndentGuide.background": "#0a0e1e12",
      "editorIndentGuide.activeBackground": "#0a0e1e28",
    },
  });
}

/** Monaco theme id for a Nexus theme mode. */
export function themeName(mode: "dark" | "light"): string {
  return mode === "light" ? "nexus-light" : "nexus-dark";
}
