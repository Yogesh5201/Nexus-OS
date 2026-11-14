"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, LogOut, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWindowStore } from "@/store/useWindowStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { signOut, authErrorMessage } from "@/services/auth";
import { cn } from "@/lib/utils";

/**
 * Taskbar account control: shows the signed-in user's avatar (or a generic
 * guest tile) with a dropdown for the profile, settings and sign-out / sign-in.
 */
export function UserMenu() {
  const { isGuest, displayName, photoURL, email } = useUserProfile();
  const exitGuest = useAuthStore((s) => s.exitGuest);
  const openApp = useWindowStore((s) => s.open);
  const pushNotification = useNotificationStore((s) => s.push);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Home-screen label is always the resolved name (never a full email);
  // the email shows only as the dropdown subtitle below.
  const subtitle = isGuest ? "Offline · local only" : email || "Signed in";

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      pushNotification({
        title: "Signed out",
        message: "You've been signed out of NEXUS.",
        kind: "info",
      });
      // AuthProvider's listener will flip the gate back to the login screen.
    } catch (err) {
      pushNotification({
        title: "Sign-out failed",
        message: authErrorMessage(err),
        kind: "error",
      });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  function handleGuestSignIn() {
    // Leave guest mode → OS gate shows the login screen.
    exitGuest();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-lg pl-1 pr-2 transition-colors hover:bg-glass/60"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          name={displayName}
          photoURL={photoURL}
          className="h-6 w-6 rounded-md"
          textClassName="text-[11px]"
        />
        <span className="hidden max-w-[8rem] truncate text-xs font-medium text-text sm:inline">
          {displayName}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="glass-strong absolute right-0 top-10 z-50 w-60 rounded-2xl p-2 shadow-float"
          >
            {/* Identity header */}
            <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
              <Avatar
                name={displayName}
                photoURL={photoURL}
                className="h-10 w-10"
                textClassName="text-base"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text">
                  {displayName}
                </div>
                <div className="truncate text-xs text-muted">{subtitle}</div>
              </div>
            </div>

            <div className="my-1 h-px bg-border/10" />

            <MenuItem
              icon={SettingsIcon}
              label="Settings"
              onClick={() => {
                openApp("settings");
                setOpen(false);
              }}
            />

            {isGuest ? (
              <MenuItem
                icon={LogIn}
                label="Sign in"
                onClick={handleGuestSignIn}
              />
            ) : (
              <MenuItem
                icon={busy ? Loader2 : LogOut}
                iconSpin={busy}
                label="Sign out"
                danger
                disabled={busy}
                onClick={handleSignOut}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  iconSpin,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconSpin?: boolean;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors disabled:opacity-50",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-muted hover:bg-glass/50 hover:text-text"
      )}
    >
      <Icon className={cn("h-4 w-4", iconSpin && "animate-spin")} />
      {label}
    </button>
  );
}
