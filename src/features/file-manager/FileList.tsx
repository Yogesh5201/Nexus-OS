"use client";

import { Heart, Share2, Star } from "lucide-react";
import { cn, formatBytes, timeAgo } from "@/lib/utils";
import { iconFor, kindLabel, type FileViewProps } from "./helpers";
import { RenameInput } from "./RenameInput";

/** Detail/list view (macOS Finder list view / Explorer details). */
export function FileList(props: FileViewProps) {
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
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 z-10 bg-bg/80 text-[11px] uppercase tracking-wider text-muted backdrop-blur">
        <tr>
          <th className="px-3 py-2 font-medium">Name</th>
          <th className="hidden px-3 py-2 font-medium sm:table-cell">Type</th>
          <th className="px-3 py-2 font-medium">Size</th>
          <th className="hidden px-3 py-2 font-medium md:table-cell">Modified</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => {
          const Icon = iconFor(node);
          const isSelected = selected.has(node.id);
          const isFolder = node.kind === "folder";
          const isDropTarget = dropTargetId === node.id;
          return (
            <tr
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
                "cursor-pointer border-t border-border/10 transition-colors",
                isSelected ? "bg-accent/20" : "hover:bg-glass/40",
                isDropTarget && "ring-2 ring-inset ring-accent bg-accent/10"
              )}
            >
              <td className="px-3 py-2 text-text">
                <div className="flex items-center gap-2.5">
                  {node.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={node.thumbnail}
                      alt=""
                      draggable={false}
                      className="h-7 w-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <Icon className={cn("h-4 w-4 shrink-0", isFolder ? "text-accent" : "text-muted")} />
                  )}
                  {renamingId === node.id ? (
                    <RenameInput
                      initial={node.name}
                      isFolder={isFolder}
                      className="text-sm"
                      onCommit={(name) => onRenameCommit(node, name)}
                      onCancel={onRenameCancel}
                    />
                  ) : (
                    <span className="truncate" title={node.name}>
                      {node.name}
                    </span>
                  )}
                  <div className="ml-1 flex gap-1">
                    {node.shared && <Share2 className="h-3 w-3 text-accent" />}
                    {node.favorite && <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />}
                    {node.starred && <Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-2 text-muted sm:table-cell">{kindLabel(node)}</td>
              <td className="px-3 py-2 text-muted">{isFolder ? "—" : formatBytes(node.size)}</td>
              <td className="hidden px-3 py-2 text-muted md:table-cell">{timeAgo(node.updatedAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
