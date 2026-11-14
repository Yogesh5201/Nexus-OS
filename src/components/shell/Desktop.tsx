"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Taskbar } from "./Taskbar";
import { Dock } from "./Dock";
import { Widgets } from "./Widgets";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";
import { WindowManager } from "@/components/window/WindowManager";
import { useUIStore } from "@/store/useUIStore";
import { useWindowStore } from "@/store/useWindowStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useKeyboardShortcuts, type Shortcut } from "@/hooks/useKeyboardShortcuts";

/**
 * The desktop environment: 3D wallpaper (mounted by <OS/>) sits behind this.
 * Layers: widgets → windows → chrome (taskbar/dock) → overlays.
 */
export function Desktop() {
  const { toggleCommand, setCommandOpen, toggleNotifications } = useUIStore();
  const windows = useWindowStore((s) => s.windows);
  const focusedId = useMemo(
    () => windows.reduce((top, w) => (!top || w.z > top.z ? w : top), windows[0])?.id,
    [windows]
  );
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const close = useWindowStore((s) => s.close);
  const applySnap = useWindowStore((s) => s.applySnap);
  const pushNotification = useNotificationStore((s) => s.push);

  // Global keyboard shortcuts for the shell + window management.
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { key: "k", meta: true, allowInInput: true, handler: () => toggleCommand() },
      { key: "j", meta: true, handler: () => toggleNotifications() },
      {
        key: "arrowleft",
        meta: true,
        handler: () => focusedId && applySnap(focusedId, "left"),
      },
      {
        key: "arrowright",
        meta: true,
        handler: () => focusedId && applySnap(focusedId, "right"),
      },
      {
        key: "arrowup",
        meta: true,
        handler: () => focusedId && toggleMaximize(focusedId),
      },
      { key: "w", meta: true, handler: () => focusedId && close(focusedId) },
    ],
    [toggleCommand, toggleNotifications, focusedId, applySnap, toggleMaximize, close]
  );
  useKeyboardShortcuts(shortcuts);

  // One-time welcome notification.
  useEffect(() => {
    const t = setTimeout(() => {
      pushNotification({
        title: "Welcome to NEXUS",
        message: "Press ⌘K to search apps, or click the dock to get started.",
        kind: "info",
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [pushNotification]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Widgets />
      <WindowManager />
      <Taskbar />
      <Dock />
      <CommandPalette />
      <NotificationCenter />

      {/* Click empty desktop closes the command palette */}
      <div
        className="absolute inset-0 -z-[1]"
        onClick={() => setCommandOpen(false)}
        aria-hidden
      />
    </motion.main>
  );
}
