"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthStatus, AuthUser } from "@/types/auth";

interface AuthState {
  /** Current lifecycle state — drives the auth gate in <OS/>. */
  status: AuthStatus;
  /** The signed-in user, or null when guest/signed-out. */
  user: AuthUser | null;
  /** "Remember me" preference, persisted so it survives reloads. */
  remember: boolean;
  /** Set when the user explicitly chose to continue offline. Persisted. */
  guest: boolean;

  // --- setters (called by AuthProvider + login screen) ---
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setRemember: (remember: boolean) => void;
  /** Enter offline guest mode (no account). */
  continueAsGuest: () => void;
  /** Leave guest mode (e.g. to return to the login screen to sign in). */
  exitGuest: () => void;
}

/**
 * Global auth state. Only `remember` and `guest` are persisted to localStorage;
 * the authoritative `user`/`status` come from Firebase via AuthProvider on every
 * load (persistent sessions are handled by Firebase's own persistence layer).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: "loading",
      user: null,
      remember: true,
      guest: false,

      setUser: (user) => set({ user }),
      setStatus: (status) => set({ status }),
      setRemember: (remember) => set({ remember }),
      continueAsGuest: () => set({ guest: true, status: "guest", user: null }),
      exitGuest: () => set({ guest: false, status: "signedOut" }),
    }),
    {
      name: "nexus.auth",
      // Never persist the user object — Firebase is the source of truth.
      partialize: (s) => ({ remember: s.remember, guest: s.guest }),
    }
  )
);
