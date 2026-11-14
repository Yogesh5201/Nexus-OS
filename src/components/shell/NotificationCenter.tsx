"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Moon, Sun, Wifi, X, Zap } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useClock } from "@/hooks/useClock";
import { formatClock, formatDateLong, timeAgo } from "@/lib/utils";
import { Switch } from "@/components/ui/Switch";

/** Slide-in panel: live clock, quick toggles and the notification feed. */
export function NotificationCenter() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const { notifications, dismiss, markAllRead, clear } = useNotificationStore();
  const now = useClock();

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const wallpaperEnabled = useSettingsStore((s) => s.wallpaperEnabled);
  const setWallpaperEnabled = useSettingsStore((s) => s.setWallpaperEnabled);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled);

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationsOpen(false)}
          />
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="glass-strong fixed right-3 top-14 bottom-3 z-[100] flex w-[340px] flex-col gap-4 rounded-3xl p-4 shadow-float"
          >
            {/* Clock card */}
            <div className="rounded-2xl bg-glass/40 p-4 text-center">
              <div className="text-3xl font-semibold text-text">{formatClock(now)}</div>
              <div className="text-xs text-muted">{formatDateLong(now)}</div>
            </div>

            {/* Quick toggles */}
            <div className="grid grid-cols-1 gap-2">
              <ToggleRow
                icon={theme === "dark" ? Moon : Sun}
                label="Appearance"
                value={theme === "dark"}
                onChange={(v) => setTheme(v ? "dark" : "light")}
                hint={theme === "dark" ? "Dark" : "Light"}
              />
              <ToggleRow
                icon={Wifi}
                label="3D Wallpaper"
                value={wallpaperEnabled}
                onChange={setWallpaperEnabled}
              />
              <ToggleRow
                icon={Zap}
                label="Animations"
                value={animationsEnabled}
                onChange={setAnimationsEnabled}
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Notifications
              </span>
              <div className="flex gap-2">
                <button
                  onClick={markAllRead}
                  className="text-muted transition-colors hover:text-text"
                  aria-label="Mark all read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clear}
                  className="text-[11px] text-muted transition-colors hover:text-text"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted">
                  <Bell className="h-6 w-6 opacity-50" />
                  <span className="text-xs">You&apos;re all caught up</span>
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="group relative rounded-xl bg-glass/40 p-3 transition-colors hover:bg-glass/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-text">{n.title}</span>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="text-muted opacity-0 transition-opacity hover:text-text group-hover:opacity-100"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {n.message && <p className="mt-0.5 text-xs text-muted">{n.message}</p>}
                  <span className="mt-1 block text-[10px] text-muted/70">{timeAgo(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  value,
  onChange,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-glass/40 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-sm text-text">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
        <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
      </div>
    </div>
  );
}
