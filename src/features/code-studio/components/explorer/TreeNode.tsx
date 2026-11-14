"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import { iconFor } from "../../data/languages";

export interface TreeCtx {
  renamingId: string | null;
  startRename: (id: string) => void;
  commitRename: (id: string, name: string) => void;
  cancelRename: () => void;
}

/** One row in the file tree; folders recurse into their children. */
export default function TreeNode({
  nodeId,
  depth,
  ctx,
}: {
  nodeId: string;
  depth: number;
  ctx: TreeCtx;
}) {
  const node = useCodeStudioStore((s) => s.getNode(nodeId));
  const children = useCodeStudioStore((s) =>
    node?.kind === "folder" ? s.childrenOf(nodeId) : []
  );
  const expanded = useCodeStudioStore((s) => s.expandedFolderIds.includes(nodeId));
  const activeTabId = useCodeStudioStore((s) => s.activeTabId);
  const toggleFolder = useCodeStudioStore((s) => s.toggleFolder);
  const openTab = useCodeStudioStore((s) => s.openTab);
  const move = useCodeStudioStore((s) => s.move);
  const remove = useCodeStudioStore((s) => s.remove);
  const descendantIds = useCodeStudioStore((s) => s.descendantIds);

  const [dropTarget, setDropTarget] = useState(false);

  if (!node) return null;
  const isFolder = node.kind === "folder";
  const isActive = node.id === activeTabId;
  const renaming = ctx.renamingId === node.id;
  const Icon = isFolder ? (expanded ? FolderOpen : Folder) : iconFor(node.name);

  const onClick = () => {
    if (renaming) return;
    if (isFolder) toggleFolder(node.id);
    else openTab(node.id);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hasChildren = isFolder && descendantIds(node.id).length > 0;
    if (
      hasChildren &&
      typeof window !== "undefined" &&
      !window.confirm(`Delete "${node.name}" and its contents?`)
    )
      return;
    remove([node.id]);
  };

  return (
    <div>
      <div
        role="treeitem"
        aria-expanded={isFolder ? expanded : undefined}
        draggable={!renaming}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/cs-node", node.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          if (!isFolder) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDropTarget(true);
        }}
        onDragLeave={() => setDropTarget(false)}
        onDrop={(e) => {
          setDropTarget(false);
          if (!isFolder) return;
          e.preventDefault();
          const dragged = e.dataTransfer.getData("text/cs-node");
          if (dragged && dragged !== node.id) {
            move([dragged], node.id);
            useCodeStudioStore.getState().setFolderExpanded(node.id, true);
          }
        }}
        onClick={onClick}
        className={cn(
          "group flex cursor-pointer items-center gap-1 rounded-md py-[3px] pr-1.5 text-[12.5px] transition-colors",
          isActive ? "bg-accent/15 text-text" : "text-muted hover:bg-glass/50 hover:text-text",
          dropTarget && "ring-1 ring-accent/60"
        )}
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              expanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isFolder && "text-accent/80")} />

        {renaming ? (
          <RenameField
            initial={node.name}
            onCommit={(name) => ctx.commitRename(node.id, name)}
            onCancel={ctx.cancelRename}
          />
        ) : (
          <span className="flex-1 truncate">{node.name}</span>
        )}

        {!renaming && (
          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                ctx.startRename(node.id);
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:text-text"
              aria-label="Rename"
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="flex h-5 w-5 items-center justify-center rounded hover:text-danger"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>

      {isFolder && expanded && (
        <div role="group">
          {children.map((child) => (
            <TreeNode key={child.id} nodeId={child.id} depth={depth + 1} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline rename input; commits on Enter/blur, cancels on Escape. */
function RenameField({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf(".");
    el.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value);
        else if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onCommit(value)}
      className="min-w-0 flex-1 rounded border border-accent/50 bg-surface px-1 py-0 text-[12.5px] text-text outline-none"
    />
  );
}
