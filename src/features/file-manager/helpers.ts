"use client";

import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Folder,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import type { FileNode } from "@/store/useFilesStore";

import type { MouseEvent as ReactMouseEvent, DragEvent as ReactDragEvent } from "react";

export type SortKey = "name" | "size" | "type" | "modified";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";
export type PreviewKind =
  | "image"
  | "pdf"
  | "markdown"
  | "audio"
  | "video"
  | "text"
  | "none";

/** Sidebar locations. "folder" browses the tree; the rest are smart views. */
export type ViewKey =
  | "folder"
  | "recent"
  | "favorites"
  | "starred"
  | "shared"
  | "trash";

/** Shared interaction props passed to both the grid and list views. */
export interface FileViewProps {
  nodes: FileNode[];
  selected: Set<string>;
  renamingId: string | null;
  dropTargetId: string | null;
  onItemPointerDown: (e: ReactMouseEvent, node: FileNode) => void;
  onItemClick: (e: ReactMouseEvent, node: FileNode) => void;
  onItemDoubleClick: (node: FileNode) => void;
  onItemContextMenu: (e: ReactMouseEvent, node: FileNode) => void;
  onRenameCommit: (node: FileNode, name: string) => void;
  onRenameCancel: () => void;
  onDragStartItem: (e: ReactDragEvent, node: FileNode) => void;
  onDragEndItem: () => void;
  onFolderDragOver: (e: ReactDragEvent, node: FileNode) => void;
  onFolderDragLeave: () => void;
  onDropOnFolder: (e: ReactDragEvent, node: FileNode) => void;
}

/** Pick a lucide icon for a node based on kind + mime type. */
export function iconFor(node: Pick<FileNode, "kind" | "type" | "name">): LucideIcon {
  if (node.kind === "folder") return Folder;
  const t = node.type || "";
  const name = node.name.toLowerCase();
  if (t.startsWith("image/")) return ImageIcon;
  if (t.startsWith("video/")) return FileVideo;
  if (t.startsWith("audio/")) return FileAudio;
  if (t === "application/pdf" || name.endsWith(".pdf")) return FileType;
  if (t.includes("zip") || t.includes("compressed") || t.includes("tar") || t.includes("rar"))
    return FileArchive;
  if (
    t.includes("sheet") ||
    t.includes("excel") ||
    name.endsWith(".csv") ||
    name.endsWith(".xlsx")
  )
    return FileSpreadsheet;
  if (
    t.includes("json") ||
    t.includes("javascript") ||
    t.includes("typescript") ||
    /\.(json|js|ts|tsx|jsx|html|css|py|java|c|cpp|go|rs|sh|yml|yaml)$/.test(name)
  )
    return FileCode2;
  if (t.startsWith("text/") || name.endsWith(".md") || name.endsWith(".txt")) return FileText;
  return FileIcon;
}

/** Classify how a file should be previewed. */
export function previewKindFor(node: Pick<FileNode, "kind" | "type" | "name">): PreviewKind {
  if (node.kind === "folder") return "none";
  const t = node.type || "";
  const name = node.name.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (t === "text/markdown" || name.endsWith(".md") || name.endsWith(".markdown"))
    return "markdown";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("video/")) return "video";
  if (
    t.startsWith("text/") ||
    t.includes("json") ||
    t.includes("xml") ||
    /\.(txt|json|js|ts|tsx|jsx|html|css|csv|log|yml|yaml|md)$/.test(name)
  )
    return "text";
  return "none";
}

/** Human-friendly type label for the list view's "Type" column. */
export function kindLabel(node: Pick<FileNode, "kind" | "type" | "name">): string {
  if (node.kind === "folder") return "Folder";
  const t = node.type || "";
  if (t.startsWith("image/")) return `${t.split("/")[1]?.toUpperCase() || "Image"} image`;
  if (t.startsWith("video/")) return `${t.split("/")[1]?.toUpperCase() || "Video"} video`;
  if (t.startsWith("audio/")) return `${t.split("/")[1]?.toUpperCase() || "Audio"} audio`;
  if (t === "application/pdf") return "PDF document";
  const ext = node.name.split(".").pop();
  return ext ? `${ext.toUpperCase()} file` : "File";
}

/** Sort nodes — folders always first, then by the chosen key/direction. */
export function sortNodes(nodes: FileNode[], key: SortKey, dir: SortDir): FileNode[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      case "size":
        cmp = a.size - b.size;
        break;
      case "type":
        cmp = (a.type || "").localeCompare(b.type || "");
        break;
      case "modified":
        cmp = a.updatedAt - b.updatedAt;
        break;
    }
    if (cmp === 0) cmp = a.name.localeCompare(b.name, undefined, { numeric: true });
    return cmp * sign;
  });
}
