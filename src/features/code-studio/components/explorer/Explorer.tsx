"use client";

import { useState } from "react";
import { FilePlus2, FolderPlus, ListCollapse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import TreeNode, { type TreeCtx } from "./TreeNode";

/** File explorer: workspace tree with create / rename / delete / drag-move. */
export default function Explorer() {
  const roots = useCodeStudioStore((s) => s.childrenOf(null));
  const createFile = useCodeStudioStore((s) => s.createFile);
  const createFolder = useCodeStudioStore((s) => s.createFolder);
  const rename = useCodeStudioStore((s) => s.rename);
  const move = useCodeStudioStore((s) => s.move);
  const collapseAll = useCodeStudioStore((s) => s.collapseAll);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [rootDrop, setRootDrop] = useState(false);

  const ctx: TreeCtx = {
    renamingId,
    startRename: setRenamingId,
    commitRename: (id, name) => {
      rename(id, name);
      setRenamingId(null);
    },
    cancelRename: () => setRenamingId(null),
  };

  const newFile = () => {
    const node = createFile("untitled.txt", null);
    setRenamingId(node.id);
  };
  const newFolder = () => {
    const node = createFolder("New Folder", null);
    setRenamingId(node.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted/80">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <ToolbarButton label="New File" onClick={newFile}>
            <FilePlus2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="New Folder" onClick={newFolder}>
            <FolderPlus className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Collapse All" onClick={collapseAll}>
            <ListCollapse className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Tree + root drop zone */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-1.5 pb-2",
          rootDrop && "bg-accent/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setRootDrop(true);
        }}
        onDragLeave={(e) => {
          // Only clear when leaving the container, not its children.
          if (e.currentTarget === e.target) setRootDrop(false);
        }}
        onDrop={(e) => {
          setRootDrop(false);
          const dragged = e.dataTransfer.getData("text/cs-node");
          if (dragged) move([dragged], null);
        }}
      >
        {roots.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-muted/60">
            No files yet. Create one above.
          </p>
        ) : (
          roots.map((n) => (
            <TreeNode key={n.id} nodeId={n.id} depth={0} ctx={ctx} />
          ))
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-glass/60 hover:text-text"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
