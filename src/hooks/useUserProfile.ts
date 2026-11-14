"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { AuthUser } from "@/types/auth";
import { getUserDisplayName, getUserInitial } from "@/lib/userProfile";

export interface UserProfile {
  /** The raw auth user (null for guest / signed-out). */
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  /** Resolved name to show everywhere (never a full email; "Guest" fallback). */
  displayName: string;
  /** First letter of `displayName`, uppercased — for the avatar fallback. */
  initial: string;
  /** Account photo (authenticated only). */
  photoURL: string | null;
  /** Account email (authenticated only) — for menus/settings, never the home screen. */
  email: string | null;
}

/**
 * The one place identity is derived. Every profile surface (greeting, navbar,
 * user menu, dashboard, profile cards) reads from here so the display name is
 * handled consistently.
 *
 * - Authenticated: Firebase displayName → email username → "Guest".
 * - Guest/offline: the optional local display name → "Guest".
 */
export function useUserProfile(): UserProfile {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const localName = useSettingsStore((s) => s.displayName);

  const isAuthenticated = status === "authenticated" && !!user;
  const isGuest = status === "guest";

  const displayName = isAuthenticated
    ? getUserDisplayName(user)
    : localName.trim() || "Guest";

  return {
    user: isAuthenticated ? user : null,
    isAuthenticated,
    isGuest,
    displayName,
    initial: getUserInitial(displayName),
    photoURL: isAuthenticated ? user?.photoURL ?? null : null,
    email: isAuthenticated ? user?.email ?? null : null,
  };
}
