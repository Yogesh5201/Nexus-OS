"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { startSync, stopSync } from "@/services/sync/syncEngine";

/**
 * Drives the sync engine off auth state: starts pulling/pushing once the user is
 * authenticated, and stops (reverting to local-only) on guest/sign-out. Renders
 * nothing — it only wires the lifecycle.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "authenticated") {
      void startSync();
    } else {
      stopSync();
    }
  }, [status]);

  return <>{children}</>;
}
