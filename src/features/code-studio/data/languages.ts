/**
 * Code Studio — language + file-type registry.
 *
 * Maps file extensions to Monaco language ids (used to pick the editor
 * tokenizer), gives each a friendly display name, and provides a lucide icon
 * picker for the explorer / tabs.
 *
 * Monaco ships tokenizers for all of these; full IntelliSense is native only
 * for TypeScript/JavaScript, JSON, HTML and CSS (richer LSP support for the
 * rest is a later phase).
 */
import {
  Braces,
  FileCode2,
  FileJson,
  FileText,
  FileType2,
  Hash,
  Terminal as TerminalIcon,
  type LucideIcon,
} from "lucide-react";

/** extension (no dot, lowercase) → Monaco language id */
const EXT_TO_LANG: Record<string, string> = {
  // Web
  html: "html",
  htm: "html",
  xhtml: "html",
  css: "css",
  scss: "scss",
  less: "less",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  vue: "html",
  svelte: "html",
  // Data / config
  json: "json",
  jsonc: "json",
  json5: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  toml: "ini",
  ini: "ini",
  env: "ini",
  graphql: "graphql",
  gql: "graphql",
  prisma: "graphql",
  proto: "proto",
  // Docs
  md: "markdown",
  markdown: "markdown",
  mdx: "markdown",
  txt: "plaintext",
  csv: "plaintext",
  // Systems / general
  py: "python",
  pyw: "python",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  kt: "kotlin",
  kts: "kotlin",
  swift: "swift",
  dart: "dart",
  scala: "scala",
  sql: "sql",
  lua: "lua",
  pl: "perl",
  pm: "perl",
  r: "r",
  m: "objective-c",
  hs: "plaintext",
  asm: "plaintext",
  s: "plaintext",
  // Shell / scripts
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  psm1: "powershell",
  bat: "bat",
  cmd: "bat",
  dockerfile: "dockerfile",
};

/** Friendly names for the language-picker / status bar. */
const LANG_DISPLAY: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  ini: "INI",
  graphql: "GraphQL",
  proto: "Protobuf",
  markdown: "Markdown",
  plaintext: "Plain Text",
  python: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  kotlin: "Kotlin",
  swift: "Swift",
  dart: "Dart",
  scala: "Scala",
  sql: "SQL",
  lua: "Lua",
  perl: "Perl",
  r: "R",
  "objective-c": "Objective-C",
  shell: "Shell",
  powershell: "PowerShell",
  bat: "Batch",
  dockerfile: "Dockerfile",
};

/** Lowercase extension of a filename (without the dot), or "". */
export function extOf(name: string): string {
  const base = name.toLowerCase();
  if (base === "dockerfile") return "dockerfile";
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1) : "";
}

/** Monaco language id for a filename (defaults to plaintext). */
export function languageOf(name: string): string {
  return EXT_TO_LANG[extOf(name)] ?? "plaintext";
}

/** Friendly display name for a filename's language. */
export function languageDisplay(name: string): string {
  const lang = languageOf(name);
  return LANG_DISPLAY[lang] ?? "Plain Text";
}

/** True when a project file can be shown in the live HTML preview. */
export function isWebFile(name: string): boolean {
  const lang = languageOf(name);
  return lang === "html" || lang === "css" || lang === "javascript";
}

/** Pick a lucide icon for a file by its language family. */
export function iconFor(name: string): LucideIcon {
  const lang = languageOf(name);
  switch (lang) {
    case "json":
      return FileJson;
    case "markdown":
    case "plaintext":
      return FileText;
    case "html":
    case "xml":
      return FileType2;
    case "css":
    case "scss":
    case "less":
      return Hash;
    case "shell":
    case "powershell":
    case "bat":
    case "dockerfile":
      return TerminalIcon;
    case "javascript":
    case "typescript":
      return Braces;
    default:
      return FileCode2;
  }
}
