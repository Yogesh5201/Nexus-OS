"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardPaste,
  Copy,
  Download,
  FolderOpen,
  FolderPlus,
  Heart,
  MousePointerClick,
  Pencil,
  RotateCcw,
  Scissors,
  Share2,
  Star,
  Trash,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilesStore, type FileNode } from "@/store/useFilesStore";
import { useRecentFilesStore } from "@/store/useRecentFilesStore";
import { filesApi } from "@/services/api/resources";
import {
  uploadBytes,
  downloadFile,
  deleteLocalBytes,
  getBlob,
} from "@/services/files/storage";
import { generateThumbnail } from "@/services/files/thumbnails";
import { Sidebar, type SidebarCounts } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { FileGrid } from "./FileGrid";
import { FileList } from "./FileList";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { PreviewModal } from "./PreviewModal";
import { UploadProgress, type UploadItem } from "./UploadProgress";
import {
  sortNodes,
  type SortDir,
  type SortKey,
  type ViewKey,
  type ViewMode,
} from "./helpers";

const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB visual quota

const VIEW_LABELS: Record<ViewKey, string> = {
  folder: "Home",
  recent: "Recent",
  favorites: "Favorites",
  starred: "Starred",
  shared: "Shared",
  trash: "Trash",
};

interface Location {
  view: ViewKey;
  folderId: string | null;
}

export default function FileManager() {
  // ---- store -------------------------------------------------------------
  const files = useFilesStore((s) => s.files);
  const recent = useRecentFilesStore((s) => s.recent);
  const recordRecent = useRecentFilesStore((s) => s.record);

  const createFolder = useFilesStore((s) => s.createFolder);
  const addFileNode = useFilesStore((s) => s.addFileNode);
  const renameNode = useFilesStore((s) => s.renameNode);
  const setStorageRefs = useFilesStore((s) => s.setStorageRefs);
  const setThumbnail = useFilesStore((s) => s.setThumbnail);
  const moveNodes = useFilesStore((s) => s.moveNodes);
  const trashNodes = useFilesStore((s) => s.trashNodes);
  const restoreNodes = useFilesStore((s) => s.restoreNodes);
  const deleteNodesPermanent = useFilesStore((s) => s.deleteNodesPermanent);
  const emptyTrash = useFilesStore((s) => s.emptyTrash);
  const toggleStar = useFilesStore((s) => s.toggleStar);
  const toggleFavorite = useFilesStore((s) => s.toggleFavorite);
  const toggleShared = useFilesStore((s) => s.toggleShared);

  // ---- navigation --------------------------------------------------------
  const [location, setLocation] = useState<Location>({ view: "folder", folderId: null });
  const [back, setBack] = useState<Location[]>([]);
  const [forward, setForward] = useState<Location[]>([]);
  const { view, folderId: currentFolderId } = location;

  // ---- view state --------------------------------------------------------
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{ ids: string[]; mode: "copy" | "cut" } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [osDragOver, setOsDragOver] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIdsRef = useRef<string[] | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  // ---- derived: nodes in view -------------------------------------------
  const nodesInView = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base: FileNode[];
    if (view === "trash") base = files.filter((f) => f.trashed);
    else if (view === "favorites") base = files.filter((f) => f.favorite && !f.trashed);
    else if (view === "starred") base = files.filter((f) => f.starred && !f.trashed);
    else if (view === "shared") base = files.filter((f) => f.shared && !f.trashed);
    else if (view === "recent") {
      const order = new Map(recent.map((r, i) => [r.fileId, i]));
      base = files
        .filter((f) => !f.trashed && f.kind === "file" && order.has(f.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    } else base = files.filter((f) => f.parentId === currentFolderId && !f.trashed);

    const filtered = q ? base.filter((f) => f.name.toLowerCase().includes(q)) : base;
    return view === "recent" ? filtered : sortNodes(filtered, sortKey, sortDir);
  }, [files, recent, view, currentFolderId, search, sortKey, sortDir]);

  const orderedIds = useMemo(() => nodesInView.map((n) => n.id), [nodesInView]);

  const counts: SidebarCounts = useMemo(() => {
    const live = files.filter((f) => !f.trashed);
    return {
      recent: recent.filter((r) => files.some((f) => f.id === r.fileId && !f.trashed)).length,
      favorites: live.filter((f) => f.favorite).length,
      starred: live.filter((f) => f.starred).length,
      shared: live.filter((f) => f.shared).length,
      trash: files.filter((f) => f.trashed).length,
    };
  }, [files, recent]);

  const storageUsed = useMemo(
    () => files.filter((f) => f.kind === "file").reduce((sum, f) => sum + f.size, 0),
    [files]
  );

  const breadcrumb = useMemo(
    () => (view === "folder" ? useFilesStore.getState().pathTo(currentFolderId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, currentFolderId, files]
  );

  const previewNode = previewId ? files.find((f) => f.id === previewId) ?? null : null;
  const atHome = view === "folder" && currentFolderId === null;
  const uploadParent = view === "folder" ? currentFolderId : null;

  // ---- selection helpers -------------------------------------------------
  const clearSelection = useCallback(() => {
    setSelection(new Set());
    setAnchorId(null);
  }, []);

  const focusContainer = () => containerRef.current?.focus();

  // ---- navigation helpers ------------------------------------------------
  const go = useCallback(
    (loc: Location) => {
      setBack((b) => [...b, location]);
      setForward([]);
      setLocation(loc);
      clearSelection();
      setSearch("");
    },
    [location, clearSelection]
  );

  const goBack = () => {
    setBack((b) => {
      if (b.length === 0) return b;
      const last = b[b.length - 1];
      setForward((f) => [...f, location]);
      setLocation(last);
      clearSelection();
      return b.slice(0, -1);
    });
  };
  const goForward = () => {
    setForward((f) => {
      if (f.length === 0) return f;
      const last = f[f.length - 1];
      setBack((b) => [...b, location]);
      setLocation(last);
      clearSelection();
      return f.slice(0, -1);
    });
  };
  const goUp = () => {
    if (view !== "folder" || currentFolderId === null) return;
    const parent = files.find((f) => f.id === currentFolderId)?.parentId ?? null;
    go({ view: "folder", folderId: parent });
  };

  const selectSidebar = (key: ViewKey) =>
    go(key === "folder" ? { view: "folder", folderId: null } : { view: key, folderId: null });

  // ---- open / preview ----------------------------------------------------
  const openNode = useCallback(
    (node: FileNode) => {
      if (node.kind === "folder") {
        go({ view: "folder", folderId: node.id });
      } else {
        recordRecent({ fileId: node.id, name: node.name, type: node.type });
        setPreviewId(node.id);
      }
    },
    [go, recordRecent]
  );

  // ---- uploads -----------------------------------------------------------
  const handleFiles = useCallback(
    (list: FileList | File[] | null, parentId: string | null) => {
      if (!list) return;
      const arr = Array.from(list);
      if (arr.length === 0) return;
      arr.forEach((file) => {
        const node = addFileNode({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          parentId,
          kind: "file",
        });
        setUploads((u) => [
          ...u.filter((x) => x.id !== node.id),
          { id: node.id, name: file.name, progress: 0, status: "uploading" },
        ]);

        // Thumbnail (best-effort, async).
        generateThumbnail(file, node.type).then((thumb) => {
          if (thumb) setThumbnail(node.id, thumb);
        });

        uploadBytes(node.id, file, {
          name: file.name,
          onProgress: (loaded, total) => {
            const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
            setUploads((u) => u.map((x) => (x.id === node.id ? { ...x, progress: pct } : x)));
          },
        })
          .then((refs) => {
            setStorageRefs(node.id, refs);
            setUploads((u) =>
              u.map((x) => (x.id === node.id ? { ...x, status: "done", progress: 100 } : x))
            );
          })
          .catch(() => {
            setUploads((u) => u.map((x) => (x.id === node.id ? { ...x, status: "error" } : x)));
            showToast(`Upload failed: ${file.name}`);
          });
      });
    },
    [addFileNode, setThumbnail, setStorageRefs, showToast]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files, uploadParent);
    e.target.value = "";
  };

  // ---- mutations ---------------------------------------------------------
  const startRename = (nodeId: string) => {
    setSelection(new Set([nodeId]));
    setRenamingId(nodeId);
  };
  const commitRename = (node: FileNode, name: string) => {
    if (name.trim() && name !== node.name) renameNode(node.id, name);
    setRenamingId(null);
    focusContainer();
  };

  const doNewFolder = () => {
    const folder = createFolder("New Folder", uploadParent);
    if (view !== "folder") go({ view: "folder", folderId: uploadParent });
    setSelection(new Set([folder.id]));
    setTimeout(() => setRenamingId(folder.id), 0);
  };

  const freeBytes = (ids: string[]) => {
    const state = useFilesStore.getState();
    const all = new Set<string>();
    ids.forEach((i) => {
      all.add(i);
      state.descendantIds(i).forEach((d) => all.add(d));
    });
    all.forEach((fid) => {
      deleteLocalBytes(fid);
      filesApi.remove(fid).catch(() => {});
    });
  };

  const trashSelected = (ids: string[]) => {
    if (ids.length === 0) return;
    trashNodes(ids);
    clearSelection();
    showToast(`Moved ${ids.length} item${ids.length > 1 ? "s" : ""} to Trash`);
  };
  const permanentDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    freeBytes(ids);
    deleteNodesPermanent(ids);
    clearSelection();
  };
  const doEmptyTrash = () => {
    const removed = emptyTrash();
    if (removed.length) freeBytes(removed);
    clearSelection();
  };

  const doDownload = async (node: FileNode) => {
    recordRecent({ fileId: node.id, name: node.name, type: node.type });
    const ok = await downloadFile(node);
    if (!ok) showToast("Content not available to download yet.");
  };

  const doShare = (ids: string[]) => {
    ids.forEach((idv) => toggleShared(idv));
    const node = files.find((f) => f.id === ids[0]);
    if (node) {
      const link = `${window.location.origin}/api/files/${node.id}/content`;
      navigator.clipboard?.writeText(link).catch(() => {});
      showToast("Share link copied to clipboard");
    }
  };

  // ---- clipboard copy / move ---------------------------------------------
  const copyNodeDeep = useCallback(
    async (srcId: string, targetParentId: string | null) => {
      const state = useFilesStore.getState();
      const src = state.files.find((f) => f.id === srcId);
      if (!src) return;
      if (src.kind === "folder") {
        const folder = state.createFolder(src.name, targetParentId);
        const children = state.files.filter((f) => f.parentId === src.id && !f.trashed);
        for (const child of children) await copyNodeDeep(child.id, folder.id);
      } else {
        const newNode = state.addFileNode({
          name: src.name,
          size: src.size,
          type: src.type,
          parentId: targetParentId,
          kind: "file",
          thumbnail: src.thumbnail ?? undefined,
        });
        const blob = await getBlob(src);
        if (blob) {
          const refs = await uploadBytes(newNode.id, blob, { name: src.name });
          useFilesStore.getState().setStorageRefs(newNode.id, refs);
        }
      }
    },
    []
  );

  const pasteInto = useCallback(
    async (targetFolderId: string | null) => {
      if (!clipboard) return;
      if (clipboard.mode === "cut") {
        moveNodes(clipboard.ids, targetFolderId);
        setClipboard(null);
        clearSelection();
        return;
      }
      showToast("Copying…");
      for (const srcId of clipboard.ids) await copyNodeDeep(srcId, targetFolderId);
      showToast("Copied");
    },
    [clipboard, moveNodes, clearSelection, copyNodeDeep, showToast]
  );

  // ---- context menu builders --------------------------------------------
  const buildItemMenu = (node: FileNode, ids: string[]): MenuItem[] => {
    const single = ids.length === 1;
    const isFolder = node.kind === "folder";
    const pasteTarget = isFolder ? node.id : currentFolderId;
    if (view === "trash") {
      return [
        { id: "restore", label: "Restore", icon: RotateCcw, onClick: () => { restoreNodes(ids); clearSelection(); } },
        {
          id: "delforever",
          label: "Delete forever",
          icon: Trash,
          danger: true,
          separatorBefore: true,
          onClick: () => permanentDelete(ids),
        },
      ];
    }
    const items: MenuItem[] = [];
    if (single)
      items.push({
        id: "open",
        label: isFolder ? "Open" : "Preview",
        icon: FolderOpen,
        onClick: () => openNode(node),
      });
    if (!isFolder)
      items.push({ id: "download", label: "Download", icon: Download, onClick: () => ids.forEach((i) => { const n = files.find((f) => f.id === i); if (n) void doDownload(n); }) });
    if (single)
      items.push({ id: "rename", label: "Rename", icon: Pencil, shortcut: "F2", separatorBefore: true, onClick: () => startRename(node.id) });
    items.push(
      { id: "star", label: node.starred ? "Remove star" : "Star", icon: Star, separatorBefore: !single, onClick: () => ids.forEach((i) => toggleStar(i)) },
      { id: "fav", label: node.favorite ? "Remove from Favorites" : "Add to Favorites", icon: Heart, onClick: () => ids.forEach((i) => toggleFavorite(i)) },
      { id: "share", label: node.shared ? "Unshare" : "Share link", icon: Share2, onClick: () => doShare(ids) },
      { id: "copy", label: "Copy", icon: Copy, shortcut: "Ctrl+C", separatorBefore: true, onClick: () => setClipboard({ ids, mode: "copy" }) },
      { id: "cut", label: "Cut", icon: Scissors, shortcut: "Ctrl+X", onClick: () => setClipboard({ ids, mode: "cut" }) },
      { id: "paste", label: "Paste", icon: ClipboardPaste, shortcut: "Ctrl+V", disabled: !clipboard, onClick: () => void pasteInto(pasteTarget) },
      { id: "trash", label: "Move to Trash", icon: Trash2, danger: true, shortcut: "Del", separatorBefore: true, onClick: () => trashSelected(ids) }
    );
    return items;
  };

  const buildEmptyMenu = (): MenuItem[] => {
    if (view === "trash") {
      return [
        {
          id: "empty",
          label: "Empty Trash",
          icon: Trash,
          danger: true,
          disabled: counts.trash === 0,
          onClick: doEmptyTrash,
        },
      ];
    }
    return [
      { id: "newfolder", label: "New Folder", icon: FolderPlus, onClick: doNewFolder },
      { id: "upload", label: "Upload files", icon: UploadCloud, onClick: () => fileInputRef.current?.click() },
      { id: "paste", label: "Paste", icon: ClipboardPaste, disabled: !clipboard, separatorBefore: true, onClick: () => void pasteInto(uploadParent) },
      { id: "selectall", label: "Select All", icon: MousePointerClick, shortcut: "Ctrl+A", separatorBefore: true, onClick: () => setSelection(new Set(orderedIds)) },
    ];
  };

  // ---- item interaction --------------------------------------------------
  const onItemClick = (e: React.MouseEvent, node: FileNode) => {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) {
      setSelection((s) => {
        const next = new Set(s);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setAnchorId(node.id);
    } else if (e.shiftKey && anchorId) {
      const a = orderedIds.indexOf(anchorId);
      const b = orderedIds.indexOf(node.id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        setSelection(new Set(orderedIds.slice(lo, hi + 1)));
      } else setSelection(new Set([node.id]));
    } else {
      setSelection(new Set([node.id]));
      setAnchorId(node.id);
    }
  };

  const onItemContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = selection.has(node.id) ? [...selection] : [node.id];
    if (!selection.has(node.id)) {
      setSelection(new Set([node.id]));
      setAnchorId(node.id);
    }
    setMenu({ x: e.clientX, y: e.clientY, items: buildItemMenu(node, ids) });
  };

  const onBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    clearSelection();
    setMenu({ x: e.clientX, y: e.clientY, items: buildEmptyMenu() });
  };

  // ---- drag & drop -------------------------------------------------------
  const onDragStartItem = (e: React.DragEvent, node: FileNode) => {
    const ids = selection.has(node.id) ? [...selection] : [node.id];
    if (!selection.has(node.id)) setSelection(new Set([node.id]));
    dragIdsRef.current = ids;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ids.join(","));
  };
  const onDragEndItem = () => {
    dragIdsRef.current = null;
    setDropTargetId(null);
  };
  const onFolderDragOver = (e: React.DragEvent, node: FileNode) => {
    if (!dragIdsRef.current && !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(node.id);
  };
  const onFolderDragLeave = () => setDropTargetId(null);
  const onDropOnFolder = (e: React.DragEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, node.id);
    } else if (dragIdsRef.current) {
      moveNodes(dragIdsRef.current, node.id);
    }
    dragIdsRef.current = null;
  };

  const onSidebarDrop = (key: ViewKey) => {
    const ids = dragIdsRef.current;
    if (!ids) return;
    if (key === "folder") moveNodes(ids, null);
    else if (key === "trash") trashSelected(ids);
    dragIdsRef.current = null;
    setDropTargetId(null);
  };

  // OS-file drop on the empty browsing area.
  const onAreaDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setOsDragOver(true);
    }
  };
  const onAreaDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setOsDragOver(false);
  };
  const onAreaDrop = (e: React.DragEvent) => {
    setOsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      handleFiles(e.dataTransfer.files, uploadParent);
    }
  };

  // ---- keyboard ----------------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (renamingId) return;
    const meta = e.metaKey || e.ctrlKey;
    const sel = [...selection];

    if (meta && e.key.toLowerCase() === "a") {
      e.preventDefault();
      e.stopPropagation();
      setSelection(new Set(orderedIds));
    } else if (meta && e.key.toLowerCase() === "c") {
      if (sel.length) setClipboard({ ids: sel, mode: "copy" });
    } else if (meta && e.key.toLowerCase() === "x") {
      if (sel.length) setClipboard({ ids: sel, mode: "cut" });
    } else if (meta && e.key.toLowerCase() === "v") {
      void pasteInto(uploadParent);
    } else if (meta && e.key.toLowerCase() === "f") {
      e.preventDefault();
      searchRef.current?.focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (!sel.length) return;
      e.preventDefault();
      if (view === "trash") permanentDelete(sel);
      else trashSelected(sel);
    } else if (e.key === "F2") {
      if (sel.length === 1) startRename(sel[0]);
    } else if (e.key === "Enter") {
      if (sel.length === 1) {
        const node = files.find((f) => f.id === sel[0]);
        if (node) openNode(node);
      }
    } else if (e.key === "Escape") {
      setMenu(null);
      clearSelection();
    } else if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
      if (orderedIds.length === 0) return;
      e.preventDefault();
      const cur = sel.length ? orderedIds.indexOf(sel[sel.length - 1]) : -1;
      const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const nextIdx = cur < 0 ? 0 : Math.min(orderedIds.length - 1, Math.max(0, cur + delta));
      const nextId = orderedIds[nextIdx];
      setSelection(new Set([nextId]));
      setAnchorId(nextId);
    }
  };

  // Focus the container on mount so shortcuts work immediately.
  useEffect(() => {
    focusContainer();
  }, []);

  // ---- render ------------------------------------------------------------
  const viewProps = {
    nodes: nodesInView,
    selected: selection,
    renamingId,
    dropTargetId,
    onItemPointerDown: () => focusContainer(),
    onItemClick,
    onItemDoubleClick: openNode,
    onItemContextMenu,
    onRenameCommit: commitRename,
    onRenameCancel: () => setRenamingId(null),
    onDragStartItem,
    onDragEndItem,
    onFolderDragOver,
    onFolderDragLeave,
    onDropOnFolder,
  };

  const isEmpty = nodesInView.length === 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex h-full w-full outline-none bg-bg/30"
    >
      <Sidebar
        view={view}
        atHome={atHome}
        counts={counts}
        storage={{ used: storageUsed, quota: STORAGE_QUOTA }}
        onSelect={selectSidebar}
        onDropOnView={onSidebarDrop}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Toolbar
          isFolderView={view === "folder"}
          viewLabel={VIEW_LABELS[view]}
          breadcrumb={breadcrumb}
          canBack={back.length > 0}
          canForward={forward.length > 0}
          canUp={view === "folder" && currentFolderId !== null}
          onBack={goBack}
          onForward={goForward}
          onUp={goUp}
          onCrumb={(fid) => go({ view: "folder", folderId: fid })}
          search={search}
          onSearch={setSearch}
          searchRef={searchRef}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            else {
              setSortKey(key);
              setSortDir("asc");
            }
          }}
          viewMode={viewMode}
          onViewMode={setViewMode}
          onNewFolder={doNewFolder}
          onUpload={() => fileInputRef.current?.click()}
        />

        {/* Browsing area */}
        <div
          className={cn(
            "relative flex-1 overflow-y-auto",
            osDragOver && "bg-accent/5"
          )}
          onContextMenu={onBackgroundContextMenu}
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) clearSelection();
          }}
          onDragOver={onAreaDragOver}
          onDragLeave={onAreaDragLeave}
          onDrop={onAreaDrop}
        >
          {osDragOver && (
            <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/60 bg-bg/60 backdrop-blur-sm">
              <UploadCloud className="h-8 w-8 text-accent" />
              <span className="text-sm text-text">
                Drop to upload{view === "folder" && breadcrumb.length > 0 ? ` to ${breadcrumb[breadcrumb.length - 1].name}` : ""}
              </span>
            </div>
          )}

          {isEmpty ? (
            <EmptyState view={view} hasSearch={!!search} />
          ) : viewMode === "grid" ? (
            <div className="p-3">
              <FileGrid {...viewProps} />
            </div>
          ) : (
            <FileList {...viewProps} />
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-border/10 px-4 py-1.5 text-[11px] text-muted">
          <span>
            {nodesInView.length} item{nodesInView.length === 1 ? "" : "s"}
            {selection.size > 0 ? ` · ${selection.size} selected` : ""}
          </span>
          <span>
            {clipboard ? `${clipboard.ids.length} ${clipboard.mode === "cut" ? "cut" : "copied"} · ` : ""}
            cloud sync ready
          </span>
        </div>

        <UploadProgress uploads={uploads} onDismiss={() => setUploads([])} />

        {/* Transient toast */}
        {toast && (
          <div className="glass-strong absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border/10 px-4 py-1.5 text-xs text-text shadow-float animate-fade-in">
            {toast}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onInputChange} />

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}

      {previewNode && (
        <PreviewModal
          node={previewNode}
          files={nodesInView}
          onSelect={(n) => {
            recordRecent({ fileId: n.id, name: n.name, type: n.type });
            setPreviewId(n.id);
          }}
          onClose={() => setPreviewId(null)}
          onDownload={(n) => void doDownload(n)}
        />
      )}
    </div>
  );
}

function EmptyState({ view, hasSearch }: { view: ViewKey; hasSearch: boolean }) {
  const message = hasSearch
    ? "No files match your search."
    : view === "trash"
    ? "Trash is empty."
    : view === "favorites"
    ? "No favorites yet — add some with the heart action."
    : view === "starred"
    ? "No starred files yet."
    : view === "shared"
    ? "Nothing shared yet."
    : view === "recent"
    ? "No recent files yet."
    : "This folder is empty. Upload files or create a folder.";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
      <FolderOpen className="h-12 w-12 text-muted/40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
