import type { AccentPreset } from "@/types/settings";

/**
 * Curated accent palettes. Each value is an "R G B" triplet matching the
 * CSS variable format. The Settings app applies these live to :root.
 */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "nexus", name: "Nexus", accent: "56 189 248", accent2: "167 139 250" },
  { id: "aurora", name: "Aurora", accent: "52 211 153", accent2: "56 189 248" },
  { id: "solar", name: "Solar", accent: "251 191 36", accent2: "248 113 113" },
  { id: "magma", name: "Magma", accent: "248 113 113", accent2: "236 72 153" },
  { id: "ultra", name: "Ultraviolet", accent: "167 139 250", accent2: "236 72 153" },
  { id: "mint", name: "Mint", accent: "45 212 191", accent2: "129 230 217" },
  { id: "ice", name: "Ice", accent: "125 211 252", accent2: "196 181 253" },
];

export const DEFAULT_ACCENT_ID = "nexus";

export function getAccent(accentId: string): AccentPreset {
  return ACCENT_PRESETS.find((a) => a.id === accentId) ?? ACCENT_PRESETS[0];
}
