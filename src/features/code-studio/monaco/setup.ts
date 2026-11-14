/**
 * Code Studio — Monaco bootstrap.
 *
 * `configureMonaco` runs in the editor's `beforeMount` hook: it registers the
 * Nexus themes and tunes the built-in language services (TS/JS + JSON) so
 * IntelliSense, diagnostics and JSX all work out of the box.
 *
 * `editorOptions` builds the shared construction options from user prefs so
 * every editor instance stays consistent.
 */
import type { Monaco, EditorProps } from "@monaco-editor/react";
import { defineNexusThemes } from "./theme";

type Options = NonNullable<EditorProps["options"]>;

let configured = false;

export function configureMonaco(monaco: Monaco): void {
  defineNexusThemes(monaco);
  if (configured) return;
  configured = true;

  const ts = monaco.languages.typescript;

  // TypeScript / JavaScript language service: modern target, JSX, and no
  // "cannot find module" noise for our virtual, dependency-free files.
  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.React,
    allowJs: true,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    lib: ["esnext", "dom", "dom.iterable"],
    noEmit: true,
  };
  ts.typescriptDefaults.setCompilerOptions(compilerOptions);
  ts.javascriptDefaults.setCompilerOptions(compilerOptions);

  // Surface syntax + semantic errors as inline diagnostics.
  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
  ts.typescriptDefaults.setEagerModelSync(true);
  ts.javascriptDefaults.setEagerModelSync(true);

  // Permit standalone JSON with comments and validate structure.
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemaValidation: "error",
  });
}

/** Build shared editor construction options from user preferences. */
export function editorOptions(prefs: {
  fontSize: number;
  minimap: boolean;
  wordWrap: boolean;
}): Options {
  return {
    fontSize: prefs.fontSize,
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontLigatures: true,
    lineHeight: 1.6,
    minimap: { enabled: prefs.minimap, renderCharacters: false, scale: 1 },
    wordWrap: prefs.wordWrap ? "on" : "off",
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: "all",
    roundedSelection: true,
    stickyScroll: { enabled: true },
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    folding: true,
    foldingHighlight: true,
    linkedEditing: true,
    formatOnPaste: true,
    tabSize: 2,
    detectIndentation: true,
    autoIndent: "full",
    suggestSelection: "first",
    multiCursorModifier: "ctrlCmd",
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      useShadows: false,
    },
    overviewRulerBorder: false,
    fixedOverflowWidgets: true,
  };
}
