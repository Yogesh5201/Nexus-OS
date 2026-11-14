"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PerformanceMode, Settings, ThemeMode } from "@/types/settings";
import { DEFAULT_ACCENT_ID } from "@/constants/accents";

interface SettingsStore extends Settings {
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accentId: string) => void;
  setPerformance: (mode: PerformanceMode) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setReducedTransparency: (enabled: boolean) => void;
  setWallpaperEnabled: (enabled: boolean) => void;
  setDisplayName: (name: string) => void;
  reset: () => void;
}

const DEFAULTS: Settings = {
  theme: "dark",
  accentId: DEFAULT_ACCENT_ID,
  performance: "high",
  animationsEnabled: true,
  reducedTransparency: false,
  wallpaperEnabled: true,
  // Empty by default so a guest with no set name falls back to "Guest".
  displayName: "",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setAccent: (accentId) => set({ accentId }),
      setPerformance: (performance) => set({ performance }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setReducedTransparency: (reducedTransparency) => set({ reducedTransparency }),
      setWallpaperEnabled: (wallpaperEnabled) => set({ wallpaperEnabled }),
      setDisplayName: (displayName) => set({ displayName }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: "nexus.settings" }
  )
);
