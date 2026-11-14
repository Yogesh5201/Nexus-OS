"use client";

import { Globe, Star, Trash2 } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { hostOf, prettyUrl } from "./helpers";
import { SidePanel, PanelEmpty } from "./SidePanel";

export function BookmarksPanel({ onClose }: { onClose: () => void }) {
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const navigate = useBrowserStore((s) => s.navigate);
  const activeTabId = useBrowserStore((s) => s.activeTabId);

  const open = (url: string) => {
    navigate(activeTabId, url);
    onClose();
  };

  return (
    <SidePanel title="Bookmarks" icon={Star} onClose={onClose}>
      {bookmarks.length === 0 ? (
        <PanelEmpty icon={Star} text="No bookmarks yet. Star a page to save it here." />
      ) : (
        <ul className="flex flex-col gap-1">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-glass/50"
            >
              <button
                onClick={() => open(b.url)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                title={b.url}
              >
                {b.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.favicon} alt="" className="h-4 w-4 shrink-0 rounded" />
                ) : (
                  <Globe className="h-4 w-4 shrink-0 text-muted" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-text">
                    {b.title || hostOf(b.url)}
                  </span>
                  <span className="block truncate text-xs text-muted/70">
                    {prettyUrl(b.url)}
                  </span>
                </span>
              </button>
              <button
                onClick={() => removeBookmark(b.url)}
                className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-glass hover:text-red-400 group-hover:opacity-100"
                aria-label="Remove bookmark"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}
