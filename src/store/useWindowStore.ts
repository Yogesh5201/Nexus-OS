"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId } from "@/types/app";
import type { Rect, SnapZone, WindowInstance } from "@/types/window";
import { APP_REGISTRY } from "@/constants/apps";
import { clamp, id } from "@/lib/utils";

/** Reserved space so windows never hide under the taskbar / dock. */
const TASKBAR_H = 44;
const DOCK_H = 96;

interface WindowStore {
  windows: WindowInstance[];
  /** Monotonic z-index counter; the focused window always holds the top value. */
  topZ: number;
  /** Active snap-preview zone shown while dragging near an edge. */
  snapPreview: SnapZone;

  open: (appId: AppId) => void;
  close: (winId: string) => void;
  focus: (winId: string) => void;
  move: (winId: string, x: number, y: number) => void;
  resize: (winId: string, rect: Partial<Rect>) => void;
  minimize: (winId: string) => void;
  toggleMaximize: (winId: string) => void;
  restore: (winId: string) => void;
  setSnapPreview: (zone: SnapZone) => void;
  applySnap: (winId: string, zone: SnapZone) => void;
  closeAll: () => void;
}

/** Compute the work area (viewport minus chrome). SSR-safe defaults. */
function workArea() {
  if (typeof window === "undefined") {
    return { x: 0, y: TASKBAR_H, width: 1440, height: 900 - TASKBAR_H - DOCK_H };
  }
  return {
    x: 0,
    y: TASKBAR_H,
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_H - DOCK_H,
  };
}

/** Translate a snap zone into a concrete rectangle within the work area. */
export function snapRect(zone: Exclude<SnapZone, null>): Rect {
  const wa = workArea();
  const halfW = wa.width / 2;
  const halfH = wa.height / 2;
  switch (zone) {
    case "left":
      return { x: wa.x, y: wa.y, width: halfW, height: wa.height };
    case "right":
      return { x: wa.x + halfW, y: wa.y, width: halfW, height: wa.height };
    case "top":
      return { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
    case "top-left":
      return { x: wa.x, y: wa.y, width: halfW, height: halfH };
    case "top-right":
      return { x: wa.x + halfW, y: wa.y, width: halfW, height: halfH };
    case "bottom-left":
      return { x: wa.x, y: wa.y + halfH, width: halfW, height: halfH };
    case "bottom-right":
      return { x: wa.x + halfW, y: wa.y + halfH, width: halfW, height: halfH };
  }
}

export const useWindowStore = create<WindowStore>()(
  persist(
    (set, get) => ({
      windows: [],
      topZ: 10,
      snapPreview: null,

      open: (appId) => {
        const def = APP_REGISTRY[appId];
        if (!def) return;

        // If the app already has a window, just focus (or restore) it.
        const existing = get().windows.find((w) => w.appId === appId);
        if (existing) {
          if (existing.state === "minimized") get().restore(existing.id);
          get().focus(existing.id);
          return;
        }

        const wa = workArea();
        const size = def.defaultSize;
        const width = Math.min(size.width, wa.width - 40);
        const height = Math.min(size.height, wa.height - 20);
        // Cascade new windows slightly so they don't perfectly overlap.
        const offset = (get().windows.length % 6) * 28;
        const newZ = get().topZ + 1;

        const win: WindowInstance = {
          id: id("win"),
          appId,
          title: def.name,
          rect: {
            x: clamp(wa.x + (wa.width - width) / 2 + offset, wa.x, wa.x + wa.width - width),
            y: clamp(wa.y + (wa.height - height) / 2 - 20 + offset, wa.y, wa.y + wa.height - 80),
            width,
            height,
          },
          prevRect: null,
          z: newZ,
          state: "normal",
          snap: null,
          createdAt: Date.now(),
        };

        set((s) => ({ windows: [...s.windows, win], topZ: newZ }));
      },

      close: (winId) =>
        set((s) => ({ windows: s.windows.filter((w) => w.id !== winId) })),

      focus: (winId) =>
        set((s) => {
          const win = s.windows.find((w) => w.id === winId);
          if (!win || win.z === s.topZ) return s;
          const newZ = s.topZ + 1;
          return {
            topZ: newZ,
            windows: s.windows.map((w) => (w.id === winId ? { ...w, z: newZ } : w)),
          };
        }),

      move: (winId, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === winId ? { ...w, rect: { ...w.rect, x, y }, snap: null } : w
          ),
        })),

      resize: (winId, rect) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === winId ? { ...w, rect: { ...w.rect, ...rect } } : w
          ),
        })),

      minimize: (winId) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === winId ? { ...w, state: "minimized" } : w
          ),
        })),

      toggleMaximize: (winId) => {
        const win = get().windows.find((w) => w.id === winId);
        if (!win) return;
        if (win.state === "maximized") {
          get().restore(winId);
          return;
        }
        const wa = workArea();
        set((s) => ({
          topZ: s.topZ + 1,
          windows: s.windows.map((w) =>
            w.id === winId
              ? {
                  ...w,
                  prevRect: w.rect,
                  rect: { x: wa.x, y: wa.y, width: wa.width, height: wa.height },
                  state: "maximized",
                  snap: null,
                  z: s.topZ + 1,
                }
              : w
          ),
        }));
      },

      restore: (winId) =>
        set((s) => {
          const newZ = s.topZ + 1;
          return {
            topZ: newZ,
            windows: s.windows.map((w) =>
              w.id === winId
                ? {
                    ...w,
                    state: "normal",
                    rect: w.prevRect ?? w.rect,
                    prevRect: null,
                    z: newZ,
                  }
                : w
            ),
          };
        }),

      setSnapPreview: (zone) => set({ snapPreview: zone }),

      applySnap: (winId, zone) => {
        if (!zone) return;
        const rect = snapRect(zone);
        set((s) => ({
          snapPreview: null,
          windows: s.windows.map((w) =>
            w.id === winId
              ? {
                  ...w,
                  prevRect: w.snap ? w.prevRect : w.rect,
                  rect,
                  snap: zone,
                  state: "normal",
                }
              : w
          ),
        }));
      },

      closeAll: () => set({ windows: [] }),
    }),
    {
      name: "nexus.windows",
      // Persist geometry so windows reopen where the user left them.
      partialize: (s) => ({ windows: s.windows, topZ: s.topZ }),
    }
  )
);
