"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { id as genId } from "@/lib/utils";
import type {
  CursorInfo,
  LogEntry,
  LogLevel,
  NewNodeInput,
  PanelTab,
  RunState,
  SidebarView,
  VNode,
} from "../types";
import { seedWorkspace } from "../data/templates";

/** Editor / layout preferences (persisted). */
interface Prefs {
  wordWrap: boolean;
  minimap: boolean;
  fontSize: number;
  autoRun: boolean;
}

interface CodeStudioState {
  // ---- workspace ----------------------------------------------------------
  nodes: VNode[];
  // ---- tabs ---------------------------------------------------------------
  openTabIds: string[];
  activeTabId: string | null;
  // ---- explorer -----------------------------------------------------------
  expandedFolderIds: string[];
  // ---- layout -------------------------------------------------------------
  sidebarView: SidebarView;
  sidebarOpen: boolean;
  sidebarWidth: number;
  panelOpen: boolean;
  panelHeight: number;
  panelTab: PanelTab;
  previewOpen: boolean;
  previewSplit: number; // 0..1 fraction of the editor row given to the preview
  // ---- prefs --------------------------------------------------------------
  prefs: Prefs;
  // ---- transient (not persisted) -----------------------------------------
  consoleLogs: LogEntry[];
  runState: RunState;
  cursor: CursorInfo;

  // ---- file-system actions ------------------------------------------------
  createNode: (input: NewNodeInput) => VNode;
  createFile: (name: string, parentId: string | null) => VNode;
  createFolder: (name: string, parentId: string | null) => VNode;
  rename: (nodeId: string, name: string) => void;
  remove: (nodeIds: string[]) => void;
  move: (nodeIds: string[], parentId: string | null) => void;
  duplicate: (nodeId: string) => VNode | null;
  setContent: (nodeId: string, content: string) => void;

  // ---- selectors ----------------------------------------------------------
  getNode: (nodeId: string | null) => VNode | null;
  childrenOf: (parentId: string | null) => VNode[];
  pathTo: (nodeId: string | null) => VNode[];
  descendantIds: (nodeId: string) => string[];

  // ---- tabs ---------------------------------------------------------------
  openTab: (nodeId: string) => void;
  closeTab: (nodeId: string) => void;
  setActiveTab: (nodeId: string | null) => void;
  reorderTabs: (fromId: string, toId: string) => void;

  // ---- explorer -----------------------------------------------------------
  toggleFolder: (nodeId: string) => void;
  setFolderExpanded: (nodeId: string, expanded: boolean) => void;
  collapseAll: () => void;

  // ---- layout / prefs -----------------------------------------------------
  setSidebarView: (view: SidebarView) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setPanelTab: (tab: PanelTab) => void;
  setPanelHeight: (h: number) => void;
  togglePreview: () => void;
  setPreviewOpen: (open: boolean) => void;
  setPreviewSplit: (fraction: number) => void;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;

  // ---- console ------------------------------------------------------------
  pushLog: (level: LogLevel, text: string) => void;
  clearLogs: () => void;
  setRunState: (state: RunState) => void;
  setCursor: (cursor: CursorInfo) => void;

  // ---- misc ---------------------------------------------------------------
  resetWorkspace: () => void;
}

const touch = (node: VNode, patch: Partial<VNode>): VNode => ({
  ...node,
  ...patch,
  updatedAt: Date.now(),
});

/** Ensure a sibling name is unique within a folder by appending " copy"/counters. */
function uniqueName(siblings: VNode[], base: string): string {
  const taken = new Set(siblings.map((s) => s.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let n = 1;
  let candidate = `${stem} copy${ext}`;
  while (taken.has(candidate.toLowerCase())) {
    n += 1;
    candidate = `${stem} copy ${n}${ext}`;
  }
  return candidate;
}

export const useCodeStudioStore = create<CodeStudioState>()(
  persist(
    (set, get) => ({
      nodes: seedWorkspace(),
      openTabIds: ["cs_seed_html"],
      activeTabId: "cs_seed_html",
      expandedFolderIds: [],

      sidebarView: "explorer",
      sidebarOpen: true,
      sidebarWidth: 240,
      panelOpen: true,
      panelHeight: 180,
      panelTab: "console",
      previewOpen: true,
      previewSplit: 0.5,

      prefs: { wordWrap: false, minimap: true, fontSize: 13, autoRun: true },

      consoleLogs: [],
      runState: "idle",
      cursor: { line: 1, column: 1, selected: 0 },

      // ---- file system ------------------------------------------------------
      createNode: (input) => {
        const now = Date.now();
        const kind = input.kind ?? "file";
        const node: VNode = {
          id: input.id ?? genId("cs"),
          name: input.name,
          kind,
          parentId: input.parentId ?? null,
          content: kind === "file" ? input.content ?? "" : undefined,
          createdAt: input.createdAt ?? now,
          updatedAt: now,
        };
        set((s) => ({ nodes: [node, ...s.nodes] }));
        return node;
      },

      createFile: (name, parentId) => {
        const siblings = get().childrenOf(parentId);
        const node = get().createNode({
          name: uniqueName(siblings, name.trim() || "untitled.txt"),
          kind: "file",
          parentId,
          content: "",
        });
        get().openTab(node.id);
        return node;
      },

      createFolder: (name, parentId) => {
        const siblings = get().childrenOf(parentId);
        const node = get().createNode({
          name: uniqueName(siblings, name.trim() || "New Folder"),
          kind: "folder",
          parentId,
        });
        get().setFolderExpanded(node.id, true);
        return node;
      },

      rename: (nodeId, name) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId ? touch(n, { name: name.trim() || n.name }) : n
          ),
        })),

      remove: (nodeIds) => {
        const ids = new Set<string>();
        nodeIds.forEach((nid) => {
          ids.add(nid);
          get().descendantIds(nid).forEach((d) => ids.add(d));
        });
        set((s) => {
          const openTabIds = s.openTabIds.filter((t) => !ids.has(t));
          let activeTabId = s.activeTabId;
          if (activeTabId && ids.has(activeTabId)) {
            activeTabId = openTabIds[openTabIds.length - 1] ?? null;
          }
          return {
            nodes: s.nodes.filter((n) => !ids.has(n.id)),
            openTabIds,
            activeTabId,
            expandedFolderIds: s.expandedFolderIds.filter((f) => !ids.has(f)),
          };
        });
      },

      move: (nodeIds, parentId) => {
        // Guard against moving a folder into itself or its own subtree.
        const blocked = new Set<string>();
        nodeIds.forEach((nid) => {
          blocked.add(nid);
          get().descendantIds(nid).forEach((d) => blocked.add(d));
        });
        if (parentId && blocked.has(parentId)) return;
        const ids = new Set(nodeIds);
        set((s) => ({
          nodes: s.nodes.map((n) => (ids.has(n.id) ? touch(n, { parentId }) : n)),
        }));
      },

      duplicate: (nodeId) => {
        const node = get().getNode(nodeId);
        if (!node || node.kind !== "file") return null;
        const siblings = get().childrenOf(node.parentId);
        return get().createNode({
          name: uniqueName(siblings, node.name),
          kind: "file",
          parentId: node.parentId,
          content: node.content ?? "",
        });
      },

      setContent: (nodeId, content) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === nodeId ? { ...n, content, updatedAt: Date.now() } : n
          ),
        })),

      // ---- selectors --------------------------------------------------------
      getNode: (nodeId) =>
        nodeId ? get().nodes.find((n) => n.id === nodeId) ?? null : null,

      childrenOf: (parentId) => {
        const rank = (n: VNode) => (n.kind === "folder" ? 0 : 1);
        return get()
          .nodes.filter((n) => n.parentId === parentId)
          .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
      },

      pathTo: (nodeId) => {
        const byId = new Map(get().nodes.map((n) => [n.id, n]));
        const trail: VNode[] = [];
        let cur = nodeId ? byId.get(nodeId) ?? null : null;
        const guard = new Set<string>();
        while (cur && !guard.has(cur.id)) {
          guard.add(cur.id);
          trail.unshift(cur);
          cur = cur.parentId ? byId.get(cur.parentId) ?? null : null;
        }
        return trail;
      },

      descendantIds: (nodeId) => {
        const all = get().nodes;
        const out: string[] = [];
        const walk = (pid: string) => {
          for (const n of all) {
            if (n.parentId === pid) {
              out.push(n.id);
              if (n.kind === "folder") walk(n.id);
            }
          }
        };
        walk(nodeId);
        return out;
      },

      // ---- tabs -------------------------------------------------------------
      openTab: (nodeId) => {
        const node = get().getNode(nodeId);
        if (!node || node.kind !== "file") return;
        set((s) => ({
          openTabIds: s.openTabIds.includes(nodeId)
            ? s.openTabIds
            : [...s.openTabIds, nodeId],
          activeTabId: nodeId,
        }));
      },

      closeTab: (nodeId) =>
        set((s) => {
          const idx = s.openTabIds.indexOf(nodeId);
          const openTabIds = s.openTabIds.filter((t) => t !== nodeId);
          let activeTabId = s.activeTabId;
          if (activeTabId === nodeId) {
            activeTabId =
              openTabIds[Math.min(idx, openTabIds.length - 1)] ?? null;
          }
          return { openTabIds, activeTabId };
        }),

      setActiveTab: (nodeId) => set({ activeTabId: nodeId }),

      reorderTabs: (fromId, toId) =>
        set((s) => {
          const from = s.openTabIds.indexOf(fromId);
          const to = s.openTabIds.indexOf(toId);
          if (from < 0 || to < 0 || from === to) return {};
          const next = [...s.openTabIds];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { openTabIds: next };
        }),

      // ---- explorer ---------------------------------------------------------
      toggleFolder: (nodeId) =>
        set((s) => ({
          expandedFolderIds: s.expandedFolderIds.includes(nodeId)
            ? s.expandedFolderIds.filter((f) => f !== nodeId)
            : [...s.expandedFolderIds, nodeId],
        })),

      setFolderExpanded: (nodeId, expanded) =>
        set((s) => {
          const has = s.expandedFolderIds.includes(nodeId);
          if (expanded && !has)
            return { expandedFolderIds: [...s.expandedFolderIds, nodeId] };
          if (!expanded && has)
            return {
              expandedFolderIds: s.expandedFolderIds.filter((f) => f !== nodeId),
            };
          return {};
        }),

      collapseAll: () => set({ expandedFolderIds: [] }),

      // ---- layout / prefs ---------------------------------------------------
      setSidebarView: (view) =>
        set((s) => ({
          sidebarView: view,
          // Clicking the active icon collapses the sidebar (VS Code behaviour).
          sidebarOpen: s.sidebarView === view ? !s.sidebarOpen : true,
        })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(160, Math.min(480, w)) }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setPanelOpen: (open) => set({ panelOpen: open }),
      setPanelTab: (tab) => set({ panelTab: tab, panelOpen: true }),
      setPanelHeight: (h) => set({ panelHeight: Math.max(80, Math.min(600, h)) }),
      togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  setPreviewOpen: (open) => set({ previewOpen: open }),
      setPreviewSplit: (fraction) =>
        set({ previewSplit: Math.max(0.15, Math.min(0.85, fraction)) }),
      setPref: (key, value) =>
        set((s) => ({ prefs: { ...s.prefs, [key]: value } })),

      // ---- console ----------------------------------------------------------
      pushLog: (level, text) =>
        set((s) => ({
          consoleLogs: [
            ...s.consoleLogs,
            { id: genId("log"), level, text, at: Date.now() },
          ].slice(-200),
        })),
      clearLogs: () => set({ consoleLogs: [] }),
      setRunState: (state) => set({ runState: state }),
      setCursor: (cursor) => set({ cursor }),

      // ---- misc -------------------------------------------------------------
      resetWorkspace: () => {
        const seed = seedWorkspace();
        set({
          nodes: seed,
          openTabIds: [seed[0].id],
          activeTabId: seed[0].id,
          expandedFolderIds: [],
          consoleLogs: [],
        });
      },
    }),
    {
      name: "nexus.codeStudio",
      version: 1,
      // Persist workspace + layout + prefs; console logs stay transient.
      partialize: (s) => ({
        nodes: s.nodes,
        openTabIds: s.openTabIds,
        activeTabId: s.activeTabId,
        expandedFolderIds: s.expandedFolderIds,
        sidebarView: s.sidebarView,
        sidebarOpen: s.sidebarOpen,
        sidebarWidth: s.sidebarWidth,
        panelOpen: s.panelOpen,
        panelHeight: s.panelHeight,
        panelTab: s.panelTab,
        previewOpen: s.previewOpen,
        previewSplit: s.previewSplit,
        prefs: s.prefs,
      }),
    }
  )
);
