"use client";

import { create } from "zustand";
import { id } from "@/lib/utils";

export type NotificationKind = "info" | "success" | "warning" | "error";

export interface NexusNotification {
  id: string;
  title: string;
  message?: string;
  kind: NotificationKind;
  createdAt: number;
  read: boolean;
}

interface NotificationStore {
  notifications: NexusNotification[];
  push: (n: Omit<NexusNotification, "id" | "createdAt" | "read">) => void;
  dismiss: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  push: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: id("ntf"), createdAt: Date.now(), read: false },
        ...s.notifications,
      ].slice(0, 50),
    })),
  dismiss: (notifId) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== notifId) })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  clear: () => set({ notifications: [] }),
}));
