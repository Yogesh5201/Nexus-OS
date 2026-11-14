"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, NoteFolder } from "@/types/notes";
import { id } from "@/lib/utils";

interface NotesStore {
  folders: NoteFolder[];
  notes: Note[];
  activeNoteId: string | null;
  activeFolderId: string; // "all" pseudo-folder shows everything
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  setActiveFolder: (id: string) => void;
  createNote: (folderId?: string) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
}

const seedFolder: NoteFolder = { id: "general", name: "General" };
const seedNote: Note = {
  id: "welcome",
  folderId: "general",
  title: "Welcome to Notes",
  content:
    "# Welcome to NEXUS Notes\n\nThis is a **markdown** editor with live preview and autosave.\n\n- Type in the editor on the left\n- See the rendered preview on the right\n- Everything saves automatically to your browser\n\n```js\nconsole.log('Happy writing!');\n```",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      folders: [seedFolder],
      notes: [seedNote],
      activeNoteId: "welcome",
      activeFolderId: "all",

      createFolder: (name) =>
        set((s) => ({ folders: [...s.folders, { id: id("fld"), name }] })),

      deleteFolder: (folderId) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== folderId),
          notes: s.notes.filter((n) => n.folderId !== folderId),
          activeFolderId: s.activeFolderId === folderId ? "all" : s.activeFolderId,
        })),

      setActiveFolder: (activeFolderId) => set({ activeFolderId }),

      createNote: (folderId) => {
        const targetFolder =
          folderId ??
          (get().activeFolderId !== "all" ? get().activeFolderId : get().folders[0]?.id) ??
          "general";
        const note: Note = {
          id: id("note"),
          folderId: targetFolder,
          title: "Untitled",
          content: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ notes: [note, ...s.notes], activeNoteId: note.id }));
      },

      deleteNote: (noteId) =>
        set((s) => {
          const notes = s.notes.filter((n) => n.id !== noteId);
          return {
            notes,
            activeNoteId: s.activeNoteId === noteId ? notes[0]?.id ?? null : s.activeNoteId,
          };
        }),

      setActiveNote: (activeNoteId) => set({ activeNoteId }),

      updateNote: (noteId, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        })),
    }),
    { name: "nexus.notes" }
  )
);
