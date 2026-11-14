"use client";

import { Heart, Share2, Star } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { FileNode } from "@/store/useFilesStore";
import { iconFor, type FileViewProps } from "./helpers";
import { RenameInput } from "./RenameInput";

/** Icon-grid view (macOS Finder icon view / Explorer large icons). */
export function FileGrid(props: FileViewProps) {
  const {
    nodes,
    selected,
    renamingId,
    dropTargetId,
    onItemPointerDown,
    onItemClick,
    onItemDoubleClick,
    onItemContextMenu,
    onRenameCommit,
    onRenameCancel,
    onDragStartItem,
    onDragEndItem,
    onFolderDragOver,
    onFolderDragLeave,
    onDropOnFolder,
  } = props;

  return (
    <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {nodes.map((node) => {
        const Icon = iconFor(node);
        const isSelected = selected.has(node.id);
        const isFolder = node.kind === "folder";
        const isDropTarget = dropTargetId === node.id;
        return (
          <div
            key={node.id}
            draggable={renamingId !== node.id}
            onPointerDown={(e) => onItemPointerDown(e, node)}
            onClick={(e) => onItemClick(e, node)}
            onDoubleClick={() => onItemDoubleClick(node)}
            onContextMenu={(e) => onItemContextMenu(e, node)}
            onDragStart={(e) => onDragStartItem(e, node)}
            onDragEnd={onDragEndItem}
            onDragOver={isFolder ? (e) => onFolderDragOver(e, node) : undefined}
            onDragLeave={isFolder ? onFolderDragLeave : undefined}
            onDrop={isFolder ? (e) => onDropOnFolder(e, node) : undefined}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl p-3 transition-all",
              isSelected ? "bg-accent/20 ring-1 ring-accent/50" : "hover:bg-glass/50",
              isDropTarget && "ring-2 ring-accent bg-accent/10"
            )}
          >
            {/* badges */}
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              {node.shared && <Share2 className="h-3 w-3 text-accent" />}
              {node.favorite && <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />}
              {node.starred && <Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
            </div>

            <div className="flex h-16 w-16 items-center justify-center">
              {node.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={node.thumbnail}
                  alt=""
                  draggable={false}
                  className="h-16 w-16 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl",
                    isFolder ? "bg-accent/15" : "bg-glass/50"
                  )}
                >
                  <Icon className={cn("h-7 w-7", isFolder ? "text-accent" : "text-muted")} />
                </div>
              )}
            </div>

            <div className="w-full text-center">
              {renamingId === node.id ? (
                <RenameInput
                  initial={node.name}
                  isFolder={isFolder}
                  className="w-full text-center text-xs"
                  onCommit={(name) => onRenameCommit(node, name)}
                  onCancel={onRenameCancel}
                />
              ) : (
                <div className="truncate text-xs font-medium text-text" title={node.name}>
                  {node.name}
                </div>
              )}
              <div className="text-[10px] text-muted">
                {isFolder ? "Folder" : formatBytes(node.size)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
