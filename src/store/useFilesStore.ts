"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { id } from "@/lib/utils";

/**
 * A node in the File Manager tree — either a file or a folder. Metadata only;
 * the file bytes live in IndexedDB (local) and Backblaze B2 (cloud) and are
 * referenced by the b2* fields. Persisted to localStorage and synced to MongoDB
 * via the sync engine.
 */
export interface FileNode {
  id: string;
  name: string;
  kind: "file" | "folder";
  parentId: string | null;
  size: number;
  type: string;
  starred: boolean;
  favorite: boolean;
  shared: boolean;
  trashed: boolean;
  trashedAt: number | null;
  b2FileId: string | null;
  b2FileName: string | null;
  storageKey: string | null;
  thumbnail: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Fields a caller supplies when creating a node; the store fills the rest. */
export type NewFileInput = Partial<FileNode> &
  Pick<FileNode, "name"> & { kind?: "file" | "folder" };

function makeNode(input: NewFileInput): FileNode {
  const now = Date.now();
  const kind = input.kind ?? "file";
  return {
    id: input.id ?? id("file"),
    name: input.name,
    kind,
    parentId: input.parentId ?? null,
    size: input.size ?? 0,
    type: input.type ?? (kind === "folder" ? "folder" : "application/octet-stream"),
    starred: input.starred ?? false,
    favorite: input.favorite ?? false,
    shared: input.shared ?? false,
    trashed: input.trashed ?? false,
    trashedAt: input.trashedAt ?? null,
    b2FileId: input.b2FileId ?? null,
    b2FileName: input.b2FileName ?? null,
    storageKey: input.storageKey ?? null,
    thumbnail: input.thumbnail ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

const HOUR = 3.6e6;

/** First-run scaffold (folders only — no orphaned binary placeholders). */
const SEED: FileNode[] = [
  makeNode({ id: "seed_documents", name: "Documents", kind: "folder", createdAt: Date.now() - 6 * HOUR }),
  makeNode({ id: "seed_images", name: "Images", kind: "folder", createdAt: Date.now() - 6 * HOUR }),
  makeNode({ id: "seed_media", name: "Media", kind: "folder", createdAt: Date.now() - 6 * HOUR }),
];

interface FilesStore {
  files: FileNode[];
  // ---- mutations ----------------------------------------------------------
  createFolder: (name: string, parentId: string | null) => FileNode;
  addFileNode: (input: NewFileInput) => FileNode;
  renameNode: (nodeId: string, name: string) => void;
  patchNode: (nodeId: string, patch: Partial<FileNode>) => void;
  setStorageRefs: (
    nodeId: string,
    refs: { b2FileId: string | null; b2FileName: string | null; storageKey: string | null; size?: number; type?: string }
  ) => void;
  setThumbnail: (nodeId: string, thumbnail: string) => void;
  moveNodes: (nodeIds: string[], parentId: string | null) => void;
  trashNodes: (nodeIds: string[]) => void;
  restoreNodes: (nodeIds: string[]) => void;
  deleteNodesPermanent: (nodeIds: string[]) => void;
  emptyTrash: () => string[]; // returns removed ids (for byte cleanup)
  toggleStar: (nodeId: string) => void;
  toggleFavorite: (nodeId: string) => void;
  toggleShared: (nodeId: string) => void;
  // ---- selectors ----------------------------------------------------------
  childrenOf: (parentId: string | null) => FileNode[];
  pathTo: (nodeId: string | null) => FileNode[];
  descendantIds: (nodeId: string) => string[];
}

const touch = (node: FileNode, patch: Partial<FileNode>): FileNode => ({
  ...node,
  ...patch,
  updatedAt: Date.now(),
});

export const useFilesStore = create<FilesStore>()(
  persist(
    (set, get) => ({
      files: SEED,

      createFolder: (name, parentId) => {
        const node = makeNode({ name: name.trim() || "New Folder", kind: "folder", parentId });
        set((s) => ({ files: [node, ...s.files] }));
        return node;
      },

      addFileNode: (input) => {
        const node = makeNode(input);
        set((s) => ({ files: [node, ...s.files] }));
        return node;
      },

      renameNode: (nodeId, name) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === nodeId ? touch(f, { name: name.trim() || f.name }) : f
          ),
        })),

      patchNode: (nodeId, patch) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === nodeId ? touch(f, patch) : f)),
        })),

      setStorageRefs: (nodeId, refs) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === nodeId
              ? touch(f, {
                  b2FileId: refs.b2FileId,
                  b2FileName: refs.b2FileName,
                  storageKey: refs.storageKey,
                  ...(refs.size !== undefined ? { size: refs.size } : {}),
                  ...(refs.type !== undefined ? { type: refs.type } : {}),
                })
              : f
          ),
        })),

      setThumbnail: (nodeId, thumbnail) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === nodeId ? { ...f, thumbnail } : f)),
        })),

      moveNodes: (nodeIds, parentId) => {
        // Guard against moving a folder into itself or its own subtree.
        const blocked = new Set<string>();
        nodeIds.forEach((nid) => {
          blocked.add(nid);
          get().descendantIds(nid).forEach((d) => blocked.add(d));
        });
        if (parentId && blocked.has(parentId)) return;
        const ids = new Set(nodeIds);
        set((s) => ({
          files: s.files.map((f) => (ids.has(f.id) ? touch(f, { parentId }) : f)),
        }));
      },

      trashNodes: (nodeIds) => {
        const ids = new Set<string>();
        nodeIds.forEach((nid) => {
          ids.add(nid);
          get().descendantIds(nid).forEach((d) => ids.add(d));
        });
        const now = Date.now();
        set((s) => ({
          files: s.files.map((f) =>
            ids.has(f.id) ? touch(f, { trashed: true, trashedAt: now }) : f
          ),
        }));
      },

      restoreNodes: (nodeIds) => {
        const ids = new Set<string>();
        nodeIds.forEach((nid) => {
          ids.add(nid);
          get().descendantIds(nid).forEach((d) => ids.add(d));
        });
        set((s) => ({
          files: s.files.map((f) =>
            ids.has(f.id) ? touch(f, { trashed: false, trashedAt: null }) : f
          ),
        }));
      },

      deleteNodesPermanent: (nodeIds) => {
        const ids = new Set<string>();
        nodeIds.forEach((nid) => {
          ids.add(nid);
          get().descendantIds(nid).forEach((d) => ids.add(d));
        });
        set((s) => ({ files: s.files.filter((f) => !ids.has(f.id)) }));
      },

      emptyTrash: () => {
        const removed = get()
          .files.filter((f) => f.trashed)
          .map((f) => f.id);
        set((s) => ({ files: s.files.filter((f) => !f.trashed) }));
        return removed;
      },

      toggleStar: (nodeId) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === nodeId ? touch(f, { starred: !f.starred }) : f
          ),
        })),

      toggleFavorite: (nodeId) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === nodeId ? touch(f, { favorite: !f.favorite }) : f
          ),
        })),

      toggleShared: (nodeId) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === nodeId ? touch(f, { shared: !f.shared }) : f
          ),
        })),

      childrenOf: (parentId) =>
        get().files.filter((f) => f.parentId === parentId && !f.trashed),

      pathTo: (nodeId) => {
        const all = get().files;
        const byId = new Map(all.map((f) => [f.id, f]));
        const trail: FileNode[] = [];
        let current = nodeId ? byId.get(nodeId) ?? null : null;
        const guard = new Set<string>();
        while (current && !guard.has(current.id)) {
          guard.add(current.id);
          trail.unshift(current);
          current = current.parentId ? byId.get(current.parentId) ?? null : null;
        }
        return trail;
      },

      descendantIds: (nodeId) => {
        const all = get().files;
        const out: string[] = [];
        const walk = (pid: string) => {
          for (const f of all) {
            if (f.parentId === pid) {
              out.push(f.id);
              if (f.kind === "folder") walk(f.id);
            }
          }
        };
        walk(nodeId);
        return out;
      },
    }),
    {
      name: "nexus.files",
      version: 2,
      // Migrate the legacy flat `StoredFile[]` shape into `FileNode[]`.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { files?: unknown[] } | undefined;
        if (!state?.files) return persisted as never;
        if (version >= 2) return persisted as never;
        const files = (state.files as Array<Record<string, unknown>>).map((f) =>
          makeNode({
            id: typeof f.id === "string" ? f.id : undefined,
            name: typeof f.name === "string" ? f.name : "Untitled",
            kind: "file",
            size: typeof f.size === "number" ? f.size : 0,
            type: typeof f.type === "string" ? f.type : "application/octet-stream",
            updatedAt: typeof f.updatedAt === "number" ? f.updatedAt : Date.now(),
          })
        );
        return { ...(state as object), files } as never;
      },
    }
  )
);
