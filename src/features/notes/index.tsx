"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  FileText,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { cn, timeAgo } from "@/lib/utils";

type ViewMode = "split" | "preview";

/** Notes — markdown editor with folders, search, live preview & autosave. */
export default function Notes() {
  const {
    folders,
    notes,
    activeNoteId,
    activeFolderId,
    createFolder,
    setActiveFolder,
    createNote,
    deleteNote,
    setActiveNote,
    updateNote,
  } = useNotesStore();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("split");

  const active = notes.find((n) => n.id === activeNoteId) ?? null;

  const visibleNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => activeFolderId === "all" || n.folderId === activeFolderId)
      .filter(
        (n) =>
          !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeFolderId, search]);

  return (
    <div className="flex h-full w-full bg-bg/30">
      {/* Folders + note list */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border/10 bg-glass/20">
        <div className="flex items-center gap-2 p-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes"
              className="h-8 w-full rounded-lg border border-border/10 bg-glass/40 pl-8 pr-2 text-xs text-text placeholder:text-muted/70 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button
            onClick={() => createNote()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-glass/50 text-muted transition-colors hover:text-text"
            aria-label="New note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Folder chips */}
        <div className="flex flex-wrap gap-1 px-2 pb-2">
          <FolderChip
            label="All"
            active={activeFolderId === "all"}
            onClick={() => setActiveFolder("all")}
          />
          {folders.map((f) => (
            <FolderChip
              key={f.id}
              label={f.name}
              active={activeFolderId === f.id}
              onClick={() => setActiveFolder(f.id)}
            />
          ))}
          <button
            onClick={() => {
              const name = prompt("Folder name");
              if (name) createFolder(name);
            }}
            className="flex h-6 items-center gap-1 rounded-full bg-glass/40 px-2 text-[11px] text-muted hover:text-text"
          >
            <FolderPlus className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2 no-scrollbar">
          {visibleNotes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveNote(n.id)}
              className={cn(
                "group flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors",
                n.id === activeNoteId ? "bg-accent/15" : "hover:bg-glass/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-text">
                  {n.title || "Untitled"}
                </span>
                <Trash2
                  className="h-3 w-3 shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(n.id);
                  }}
                />
              </div>
              <span className="truncate text-[11px] text-muted">
                {n.content.replace(/[#*`>\n]/g, " ").slice(0, 50) || "No content"}
              </span>
              <span className="mt-0.5 text-[10px] text-muted/60">{timeAgo(n.updatedAt)}</span>
            </button>
          ))}
          {visibleNotes.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted">
              <FileText className="h-6 w-6 opacity-50" />
              <span className="text-xs">No notes</span>
            </div>
          )}
        </div>
      </aside>

      {/* Editor */}
      <div className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b border-border/10 p-2">
              <input
                value={active.title}
                onChange={(e) => updateNote(active.id, { title: e.target.value })}
                placeholder="Note title"
                className="flex-1 bg-transparent px-2 text-base font-semibold text-text placeholder:text-muted/60 focus:outline-none"
              />
              <span className="text-[11px] text-muted">Saved {timeAgo(active.updatedAt)}</span>
              <div className="flex rounded-lg bg-glass/40 p-0.5">
                <ViewToggle
                  active={view === "split"}
                  onClick={() => setView("split")}
                  icon={Pencil}
                  label="Edit"
                />
                <ViewToggle
                  active={view === "preview"}
                  onClick={() => setView("preview")}
                  icon={Eye}
                  label="Preview"
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {view === "split" && (
                <textarea
                  value={active.content}
                  onChange={(e) => updateNote(active.id, { content: e.target.value })}
                  placeholder="Start writing in markdown…"
                  spellCheck={false}
                  className="h-full flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-text placeholder:text-muted/60 focus:outline-none"
                />
              )}
              <div
                className={cn(
                  "h-full overflow-y-auto p-4",
                  view === "split"
                    ? "flex-1 border-l border-border/10"
                    : "mx-auto w-full max-w-3xl"
                )}
              >
                <Markdown content={active.content || "_Nothing to preview yet._"} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <FileText className="h-8 w-8 opacity-50" />
            <p className="text-sm">Select or create a note</p>
            <Button variant="primary" size="sm" onClick={() => createNote()}>
              <Plus className="h-4 w-4" /> New note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FolderChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px] transition-colors",
        active ? "accent-gradient text-black/80" : "bg-glass/40 text-muted hover:text-text"
      )}
    >
      {label}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        active ? "bg-accent/20 text-text" : "text-muted hover:text-text"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
