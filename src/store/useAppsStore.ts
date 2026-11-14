"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InstalledAppDTO } from "@/types/api";
import { ALL_APPS } from "@/constants/apps";

interface AppsStore {
  /** Installed apps + dock placement. Defaults to the full registry. */
  apps: InstalledAppDTO[];
}

/** Default install set mirrors the built-in app registry (UI unchanged). */
function defaults(): InstalledAppDTO[] {
  return ALL_APPS.map((a, i) => ({ appId: a.id, inDock: a.inDock, position: i }));
}

export const useAppsStore = create<AppsStore>()(
  persist(
    () => ({
      apps: defaults(),
    }),
    { name: "nexus.apps" }
  )
);
