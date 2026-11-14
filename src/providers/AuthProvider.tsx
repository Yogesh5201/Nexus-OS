"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "@/services/auth";
import { isFirebaseConfigured } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Bridges Firebase auth state into the app.
 *
 * Subscribes once to `onAuthStateChanged` and resolves the global auth status:
 *   user present            → "authenticated"
 *   no user + guest flag    → "guest"
 *   no user                 → "signedOut"
 *
 * This is also where persistent sessions are restored: Firebase rehydrates the
 * stored credential and fires the listener on load with the existing user.
 *
 * The signed-in name is NOT copied into the settings store — every surface
 * derives it consistently through `useUserProfile` / `getUserDisplayName`, so
 * the settings `displayName` stays reserved for a guest's own local name.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { setUser, setStatus, guest } = useAuthStore.getState();

    // No Firebase configured → resolve immediately to guest or signed-out.
    if (!isFirebaseConfigured) {
      setUser(null);
      setStatus(guest ? "guest" : "signedOut");
      return;
    }

    const unsub = onAuthStateChanged((user) => {
      const store = useAuthStore.getState();
      if (user) {
        store.setUser(user);
        store.setStatus("authenticated");
      } else {
        store.setUser(null);
        store.setStatus(store.guest ? "guest" : "signedOut");
      }
    });

    return unsub;
  }, []);

  return <>{children}</>;
}
