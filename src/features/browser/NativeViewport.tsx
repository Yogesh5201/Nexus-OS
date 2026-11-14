"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { RotateCw, ShieldAlert } from "lucide-react";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";
import { useWindowStore } from "@/store/useWindowStore";
import { getBridge } from "@/lib/nexusBridge";
import { hostOf } from "./helpers";

interface Rectish {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: Rectish, b: Rectish): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Whether the native view should be visible right now. Hidden when a Nexus
 * surface (panel/menu/address dropdown) is open, on load error, or when another
 * window overlaps the browser with a higher z-index — because the native view
 * always paints above all HTML.
 */
function shouldShow(placeholder: Rectish, hasError: boolean): boolean {
  if (hasError) return false;
  const { ui } = useBrowserStore.getState();
  if (ui.addressFocused || ui.menuOpen || ui.panelOpen) return false;

  const windows = useWindowStore.getState().windows;
  const browser = windows.find((w) => w.appId === "browser" && w.state !== "minimized");
  if (!browser) return false;

  for (const w of windows) {
    if (w.id === browser.id || w.state === "minimized") continue;
    if (w.z > browser.z && intersects(w.rect, placeholder)) return false;
  }
  return true;
}

/**
 * Native browser surface for the Electron shell. Renders a placeholder the
 * real Chromium WebContentsView is positioned over.
 */
export function NativeViewport({ tab }: { tab: Tab }) {
  const ref = useRef<HTMLDivElement>(null);
  const reload = useBrowserStore((s) => s.reload);
  const hasError = Boolean(tab.error);

  // Push current bounds + visibility to the main process.
  const sync = useRef(() => {});
  sync.current = () => {
    const el = ref.current;
    const bridge = getBridge();
    if (!el || !bridge) return;
    const r = el.getBoundingClientRect();
    const rect = { x: r.left, y: r.top, width: r.width, height: r.height };
    bridge.setBounds(rect);
    bridge.setVisible(shouldShow(rect, hasError));
  };

  // Keep in sync with window drags/resizes/snaps and UI-flag changes.
  useLayoutEffect(() => {
    const run = () => sync.current();
    run();

    const unsubWin = useWindowStore.subscribe(run);
    const unsubBrowser = useBrowserStore.subscribe(run);
    window.addEventListener("resize", run);

    const ro = new ResizeObserver(run);
    if (ref.current) ro.observe(ref.current);

    return () => {
      unsubWin();
      unsubBrowser();
      window.removeEventListener("resize", run);
      ro.disconnect();
    };
  }, []);

  // Re-sync when the tab identity or error state changes.
  useEffect(() => {
    sync.current();
  }, [tab.id, tab.url, hasError]);

  // Hide the native view when this component unmounts (Start page / Reader).
  useEffect(() => {
    return () => getBridge()?.setVisible(false);
  }, []);

  return (
    <div ref={ref} className="relative h-full w-full bg-white">
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border/10 p-8"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15">
              <ShieldAlert className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-text">
              {hostOf(tab.url)} didn’t load
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {tab.error?.desc || "The page couldn’t be reached."}
            </p>
            <button
              onClick={() => reload(tab.id)}
              className="accent-gradient flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
