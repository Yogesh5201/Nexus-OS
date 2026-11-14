"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecentFileDTO } from "@/types/api";

const MAX_RECENT = 20;

interface RecentFilesStore {
  recent: RecentFileDTO[];
  /** Record (or bump) a recently-accessed file, trimming to the cap. */
  record: (entry: Omit<RecentFileDTO, "accessedAt">) => void;
}

export const useRecentFilesStore = create<RecentFilesStore>()(
  persist(
    (set) => ({
      recent: [],
      record: (entry) =>
        set((s) => {
          const next = [
            { ...entry, accessedAt: Date.now() },
            ...s.recent.filter((r) => r.fileId !== entry.fileId),
          ];
          return { recent: next.slice(0, MAX_RECENT) };
        }),
    }),
    { name: "nexus.recent" }
  )
);
