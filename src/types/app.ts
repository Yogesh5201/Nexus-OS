import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/** Unique identifier for each installed application. */
export type AppId =
  | "ai-assistant"
  | "code-studio"
  | "notes"
  | "file-manager"
  | "browser"
  | "calendar"
  | "dashboard"
  | "settings";

/** Default geometry & metadata describing an installed app. */
export interface AppDefinition {
  id: AppId;
  name: string;
  /** Short description shown in launchers / tooltips. */
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the app's glyph tile. */
  accent: string;
  /** Default window size when first opened. */
  defaultSize: { width: number; height: number };
  /** Minimum window size when resizing. */
  minSize?: { width: number; height: number };
  /** Whether the app appears in the dock by default. */
  inDock: boolean;
  /**
   * Lazily-loaded window content. Kept as a loader so each app is
   * code-split and only fetched when first launched.
   */
  component: ComponentType;
}
