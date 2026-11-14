"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BootScreen } from "./BootScreen";
import { Desktop } from "./Desktop";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuthStore } from "@/store/useAuthStore";

// The 3D wallpaper is client-only (WebGL) and heavy, so load it lazily.
const WallpaperCanvas = dynamic(
  () => import("@/three/WallpaperCanvas").then((m) => m.WallpaperCanvas),
  { ssr: false }
);

/**
 * Top-level client shell. Owns the boot → desktop transition and mounts
 * the 3D wallpaper underneath the entire UI.
 */
export function OS() {
  const [booted, setBooted] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Auth status gates access to the Desktop (a "protected route").
  const status = useAuthStore((s) => s.status);

  // Avoid hydration mismatch for client-only stores.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#04050c]" />;
  }

  // Once booted, only authenticated or explicit-guest users reach the Desktop.
  const unlocked = status === "authenticated" || status === "guest";

  return (
    <>
      {/* Layer 0: the 3D wallpaper (its own GPU compositor layer). */}
      <WallpaperCanvas />

      {/* Layer 1: all UI, promoted to its own layer above the canvas so the
          two composite cleanly instead of tearing/flickering at the boundary. */}
      <div
        className="fixed inset-0 z-10"
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      >
        {!booted && <BootScreen onComplete={() => setBooted(true)} />}

        {/* After boot, resolve the auth gate. */}
        {booted && status === "loading" && (
          <div className="fixed inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}
        {booted && status === "signedOut" && <AuthScreen />}
        {booted && unlocked && <Desktop />}
      </div>
    </>
  );
}
