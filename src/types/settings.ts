export type ThemeMode = "dark" | "light";

/** Graphics fidelity tier — controls 3D particle counts & post-processing. */
export type PerformanceMode = "high" | "balanced" | "battery";

export interface AccentPreset {
  id: string;
  name: string;
  /** RGB triplet strings consumed by the CSS variables. */
  accent: string;
  accent2: string;
}

export interface Settings {
  theme: ThemeMode;
  accentId: string;
  performance: PerformanceMode;
  animationsEnabled: boolean;
  reducedTransparency: boolean;
  wallpaperEnabled: boolean;
  /** Display name used in the UI / profile. */
  displayName: string;
}
