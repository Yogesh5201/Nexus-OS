"use client";

import { useSettingsStore } from "@/store/useSettingsStore";
import { useCodeStudioStore } from "./store/useCodeStudioStore";
import type { Command } from "./types";

/** UI callbacks the registry needs that don't live in the store. */
export interface CommandContext {
  runPreview: () => void;
  openPalette: () => void;
  formatDocument: () => void;
  save: () => void;
}

/**
 * Build the Code Studio command registry. Palette entries and window-scoped
 * hotkeys both resolve through this single list so titles / shortcuts stay in
 * sync. Store mutations read the live state via `getState()`.
 */
export function buildCommands(ctx: CommandContext): Command[] {
  const store = () => useCodeStudioStore.getState();

  return [
    // ---- File --------------------------------------------------------------
    {
      id: "file.new",
      title: "New File",
      group: "File",
      keybinding: "Ctrl+N",
      run: () => {
        const { activeTabId, getNode, createFile } = store();
        const active = getNode(activeTabId);
        const parentId = active ? active.parentId : null;
        createFile("untitled.txt", parentId);
      },
    },
    {
      id: "file.newFolder",
      title: "New Folder",
      group: "File",
      run: () => store().createFolder("New Folder", null),
    },
    {
      id: "file.save",
      title: "Save (autosaved)",
      group: "File",
      keybinding: "Ctrl+S",
      run: () => ctx.save(),
    },
    {
      id: "file.reset",
      title: "Reset Workspace to Starter Project",
      group: "File",
      run: () => {
        if (
          typeof window !== "undefined" &&
          window.confirm("Reset the workspace? All files will be replaced with the starter project.")
        ) {
          store().resetWorkspace();
        }
      },
    },

    // ---- Run ---------------------------------------------------------------
    {
      id: "run.preview",
      title: "Run / Refresh Preview",
      group: "Run",
      keybinding: "Ctrl+Enter",
      run: () => ctx.runPreview(),
    },
    {
      id: "run.clearConsole",
      title: "Clear Console",
      group: "Run",
      run: () => store().clearLogs(),
    },

    // ---- View --------------------------------------------------------------
    {
      id: "view.toggleSidebar",
      title: "Toggle Sidebar",
      group: "View",
      keybinding: "Ctrl+B",
      run: () => store().toggleSidebar(),
    },
    {
      id: "view.togglePanel",
      title: "Toggle Bottom Panel",
      group: "View",
      keybinding: "Ctrl+`",
      run: () => store().togglePanel(),
    },
    {
      id: "view.togglePreview",
      title: "Toggle Live Preview",
      group: "View",
      run: () => store().togglePreview(),
    },
    {
      id: "view.toggleMinimap",
      title: "Toggle Minimap",
      group: "View",
      run: () => store().setPref("minimap", !store().prefs.minimap),
    },
    {
      id: "view.toggleWordWrap",
      title: "Toggle Word Wrap",
      group: "View",
      keybinding: "Alt+Z",
      run: () => store().setPref("wordWrap", !store().prefs.wordWrap),
    },
    {
      id: "view.toggleTheme",
      title: "Toggle Light / Dark Theme",
      group: "View",
      run: () => {
        const s = useSettingsStore.getState();
        s.setTheme(s.theme === "light" ? "dark" : "light");
      },
    },

    // ---- Editor ------------------------------------------------------------
    {
      id: "editor.format",
      title: "Format Document",
      group: "Editor",
      keybinding: "Shift+Alt+F",
      run: () => ctx.formatDocument(),
    },
    {
      id: "editor.commandPalette",
      title: "Show All Commands",
      group: "Editor",
      keybinding: "Ctrl+Shift+P",
      run: () => ctx.openPalette(),
    },
  ];
}
