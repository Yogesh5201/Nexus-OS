"use client";

import { ChevronRight } from "lucide-react";
import { useCodeStudioStore } from "../../store/useCodeStudioStore";
import { iconFor } from "../../data/languages";

/** Folder path → file trail for the active tab. */
export default function Breadcrumbs({ nodeId }: { nodeId: string }) {
  const trail = useCodeStudioStore((s) => s.pathTo(nodeId));
  if (trail.length === 0) return null;
  const file = trail[trail.length - 1];
  const Icon = iconFor(file.name);

  return (
    <div className="flex items-center gap-1 overflow-hidden px-3 py-1 text-[11px] text-muted">
      {trail.map((n, i) => (
        <span key={n.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted/50" />}
          {i === trail.length - 1 && <Icon className="h-3 w-3 text-accent/80" />}
          <span className={i === trail.length - 1 ? "text-text/80" : ""}>{n.name}</span>
        </span>
      ))}
    </div>
  );
}
