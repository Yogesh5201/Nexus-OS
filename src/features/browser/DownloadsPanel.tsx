"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileDown,
  FolderOpen,
  Pause,
  Play,
  Trash,
  X,
  XCircle,
} from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { formatBytes, timeAgo } from "@/lib/utils";
import { isElectron, getBridge } from "@/lib/nexusBridge";
import { SidePanel, PanelEmpty } from "./SidePanel";

export function DownloadsPanel({ onClose }: { onClose: () => void }) {
  const downloads = useBrowserStore((s) => s.downloads);
  const clearDownloads = useBrowserStore((s) => s.clearDownloads);

  const native = isElectron();
  const dl = getBridge()?.downloads;

  const ctrlBtn =
    "shrink-0 rounded-md p-1.5 text-muted transition hover:bg-glass hover:text-text";

  return (
    <SidePanel title="Downloads" icon={Download} onClose={onClose}>
      {downloads.length === 0 ? (
        <PanelEmpty
          icon={FileDown}
          text="Files you save while browsing will be listed here."
        />
      ) : (
        <>
          <button
            onClick={clearDownloads}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border/10 px-3 py-2 text-xs text-muted transition hover:bg-glass hover:text-red-400"
          >
            <Trash className="h-3.5 w-3.5" /> Clear list
          </button>
          <ul className="flex flex-col gap-1">
            {downloads.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-glass/50"
              >
                <span className="shrink-0">
                  {d.status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : d.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <FileDown className="h-5 w-5 text-accent" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{d.name}</span>
                  <span className="block truncate text-xs text-muted/70">
                    {d.size > 0 ? `${formatBytes(d.size)} · ` : ""}
                    {timeAgo(d.createdAt)}
                    {d.paused ? " · paused" : ""}
                  </span>
                  {d.status === "in_progress" && (
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-glass">
                      <span
                        className="block h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.round(d.progress * 100)}%` }}
                      />
                    </span>
                  )}
                </span>

                {/* Native controls */}
                {native && dl && d.status === "in_progress" && (
                  <>
                    <button
                      onClick={() => (d.paused ? dl.resume(d.id) : dl.pause(d.id))}
                      className={ctrlBtn}
                      aria-label={d.paused ? "Resume" : "Pause"}
                      title={d.paused ? "Resume" : "Pause"}
                    >
                      {d.paused ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => dl.cancel(d.id)}
                      className={ctrlBtn}
                      aria-label="Cancel"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {native && dl && d.status === "complete" && (
                  <>
                    <button
                      onClick={() => dl.openFile(d.id)}
                      className={ctrlBtn}
                      aria-label="Open file"
                      title="Open file"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => dl.openFolder(d.id)}
                      className={ctrlBtn}
                      aria-label="Show in folder"
                      title="Show in folder"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {!native && (
                  <button
                    onClick={() => window.open(d.url, "_blank", "noopener,noreferrer")}
                    className={ctrlBtn}
                    aria-label="Open"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </SidePanel>
  );
}
