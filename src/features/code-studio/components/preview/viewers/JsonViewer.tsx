"use client";

import { useMemo, useState } from "react";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interactive, collapsible JSON tree with a clear parse-error state. */
export default function JsonViewer({ content }: { content: string }) {
  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(content) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [content]);

  if (!parsed.ok) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <TriangleAlert className="h-5 w-5 text-danger" />
        <p className="text-sm font-medium text-text">Invalid JSON</p>
        <p className="max-w-xs font-mono text-[11px] text-muted/70">{parsed.error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed">
      <JsonNode name={null} value={parsed.value} depth={0} defaultOpen />
    </div>
  );
}

function JsonNode({
  name,
  value,
  depth,
  defaultOpen = false,
}: {
  name: string | null;
  value: unknown;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 1);

  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === "object";
  const keyLabel = name !== null && <span className="text-accent">&quot;{name}&quot;</span>;

  if (!isObject) {
    return (
      <div className="flex gap-1.5" style={{ paddingLeft: depth * 14 }}>
        {keyLabel}
        {name !== null && <span className="text-muted">:</span>}
        <Primitive value={value} />
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const bracket = isArray ? ["[", "]"] : ["{", "}"];

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-1 hover:bg-glass/30"
        style={{ paddingLeft: depth * 14 }}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight
          className={cn("h-3 w-3 shrink-0 text-muted transition-transform", open && "rotate-90")}
        />
        {keyLabel}
        {name !== null && <span className="text-muted">:</span>}
        <span className="text-muted/70">
          {bracket[0]}
          {!open && <span className="opacity-60">{entries.length} </span>}
          {!open && bracket[1]}
        </span>
      </div>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <JsonNode key={k} name={isArray ? null : k} value={v} depth={depth + 1} />
          ))}
          <div className="text-muted/70" style={{ paddingLeft: depth * 14 + 14 }}>
            {bracket[1]}
          </div>
        </div>
      )}
    </div>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (typeof value === "string")
    return <span className="text-success">&quot;{value}&quot;</span>;
  if (typeof value === "number") return <span className="text-warning">{value}</span>;
  if (typeof value === "boolean")
    return <span className="text-accent-2">{String(value)}</span>;
  return <span className="text-muted">null</span>;
}
