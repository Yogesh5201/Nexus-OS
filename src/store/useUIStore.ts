"use client";

import { create } from "zustand";

/** Transient UI state for shell overlays (not persisted). */
interface UIStore {
  commandOpen: boolean;
  notificationsOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleNotifications: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  commandOpen: false,
  notificationsOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
}));
