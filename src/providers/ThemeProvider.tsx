"use client";

import { useEffect, type ReactNode } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { getAccent } from "@/constants/accents";

/**
 * Bridges the settings store to the DOM: writes accent CSS variables,
 * toggles light/dark and animation classes on <html>. This keeps theming
 * fully runtime-swappable without a page reload.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const accentId = useSettingsStore((s) => s.accentId);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const reducedTransparency = useSettingsStore((s) => s.reducedTransparency);

  useEffect(() => {
    const root = document.documentElement;
    const accent = getAccent(accentId);
    root.style.setProperty("--accent", accent.accent);
    root.style.setProperty("--accent-2", accent.accent2);
  }, [accentId]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-light", theme === "light");
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("no-anim", !animationsEnabled);
  }, [animationsEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduced-transparency", reducedTransparency);
  }, [reducedTransparency]);

  return <>{children}</>;
}
