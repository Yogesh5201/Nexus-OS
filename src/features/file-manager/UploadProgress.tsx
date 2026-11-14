"use client";

import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadItem {
  id: string;
  name: string;
  progress: number; // 0..100
  status: "uploading" | "done" | "error";
}

interface UploadProgressProps {
  uploads: UploadItem[];
  onDismiss: () => void;
}

/** Floating upload tracker (bottom-right of the File Manager). */
export function UploadProgress({ uploads, onDismiss }: UploadProgressProps) {
  if (uploads.length === 0) return null;
  const active = uploads.filter((u) => u.status === "uploading").length;
  const done = uploads.filter((u) => u.status === "done").length;

  return (
    <div className="glass-strong absolute bottom-3 right-3 z-30 w-72 overflow-hidden rounded-xl border border-border/10 shadow-float animate-scale-in">
      <div className="flex items-center justify-between border-b border-border/10 px-3 py-2">
        <span className="text-xs font-medium text-text">
          {active > 0 ? `Uploading ${active} item${active > 1 ? "s" : ""}…` : `${done} uploaded`}
        </span>
        <button
          onClick={onDismiss}
          className="rounded p-0.5 text-muted hover:bg-glass/60 hover:text-text"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto p-1.5">
        {uploads.map((u) => (
          <div key={u.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="shrink-0">
              {u.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : u.status === "error" ? (
                <XCircle className="h-4 w-4 text-danger" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] text-text" title={u.name}>
                {u.name}
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-glass/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    u.status === "error" ? "bg-danger" : "accent-gradient"
                  )}
                  style={{ width: `${u.status === "done" ? 100 : u.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
