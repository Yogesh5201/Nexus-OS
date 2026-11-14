/**
 * Code Studio — shared types.
 *
 * The IDE keeps its whole workspace (files, folders, tabs, layout, prefs) in a
 * single Zustand store. These types describe that state and the smaller value
 * objects passed between components.
 */

/** A node in the virtual file system — a file (with inline text) or a folder. */
export interface VNode {
  id: string;
  name: string;
  kind: "file" | "folder";
  /** Parent folder id, or null when the node lives at the workspace root. */
  parentId: string | null;
  /** Text contents — only present on files. */
  content?: string;
  createdAt: number;
  updatedAt: number;
}

/** Fields a caller supplies when creating a node; the store fills the rest. */
export type NewNodeInput = Partial<VNode> &
  Pick<VNode, "name"> & { kind?: "file" | "folder" };

/** Which view the left sidebar is showing (activity-bar selection). */
export type SidebarView = "explorer" | "search" | "run" | "ai" | "settings";

/** Bottom-panel tabs. */
export type PanelTab = "console" | "problems" | "output";

/** Console/severity level for a captured log line. */
export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

/** One line of captured console output from the live preview / a runtime. */
export interface LogEntry {
  id: string;
  level: LogLevel;
  text: string;
  at: number;
}

/** Coarse run/preview status surfaced in the status bar. */
export type RunState = "idle" | "running" | "error";

/** Cursor position + selection info reported by Monaco to the status bar. */
export interface CursorInfo {
  line: number;
  column: number;
  /** Number of characters selected (0 when it's just a caret). */
  selected: number;
}

/** A command in the palette / hotkey registry. */
export interface Command {
  id: string;
  title: string;
  /** Section shown in the palette, e.g. "File", "View", "Run". */
  group: string;
  /** Human-readable shortcut hint, e.g. "Ctrl+Enter". */
  keybinding?: string;
  run: () => void;
}
