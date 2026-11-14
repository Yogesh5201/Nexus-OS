"use client";

import { Bell, Search, Sparkles, Wifi, BatteryFull, Cpu } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { formatClock, formatDateLong } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { useWindowStore } from "@/store/useWindowStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { Tooltip } from "@/components/ui/Tooltip";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

/** Top system bar: brand, search, AI launcher, status icons, clock. */
export function Taskbar() {
  const now = useClock();
  const { toggleCommand, toggleNotifications } = useUIStore();
  const openApp = useWindowStore((s) => s.open);
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-glass/60 hover:text-text";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-11 items-center justify-between px-3">
      {/* Left: brand + active hint */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="glass flex h-8 items-center gap-2 rounded-lg px-3">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold tracking-wide text-gradient">NEXUS</span>
        </div>
      </div>

      {/* Center: search / command palette */}
      <div className="pointer-events-auto">
        <button
          onClick={toggleCommand}
          className="glass flex h-8 items-center gap-2 rounded-lg px-3 text-xs text-muted transition-colors hover:text-text"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search apps & actions</span>
          <kbd className="ml-1 hidden rounded bg-glass/80 px-1.5 py-0.5 text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: AI, status, notifications, clock */}
      <div className="pointer-events-auto flex items-center gap-1">
        <Tooltip content="Ask NEXUS AI">
          <button
            onClick={() => openApp("ai-assistant")}
            className={cn(iconBtn, "text-accent hover:text-accent")}
            aria-label="Open AI Assistant"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </Tooltip>

        <div className="mx-1 hidden items-center gap-2 text-muted/70 sm:flex">
          <Cpu className="h-3.5 w-3.5" />
          <Wifi className="h-3.5 w-3.5" />
          <BatteryFull className="h-3.5 w-3.5" />
        </div>

        <Tooltip content="Notifications">
          <button
            onClick={toggleNotifications}
            className={cn(iconBtn, "relative")}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent shadow-glow" />
            )}
          </button>
        </Tooltip>

        <div className="glass ml-1 flex h-8 flex-col items-end justify-center rounded-lg px-3 leading-none">
          <span className="text-xs font-semibold text-text">{formatClock(now)}</span>
          <span className="text-[10px] text-muted">{formatDateLong(now)}</span>
        </div>

        {/* Account: avatar, profile & sign-out */}
        <div className="glass ml-1 flex h-8 items-center rounded-lg px-0.5">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
