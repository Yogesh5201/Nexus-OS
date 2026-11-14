import "server-only";

/**
 * Settings service — reads/writes the per-user settings document, returning the
 * exact client `Settings` shape so the settings store hydrates directly.
 */
import { settingsRepository } from "@/server/repositories/settings.repository";
import type { SettingsDoc } from "@/server/schemas/settings.schema";
import { DEFAULT_ACCENT_ID } from "@/constants/accents";
import { asObject, oneOf, optionalBoolean, optionalString } from "@/server/validation";
import type { SettingsDTO } from "@/types/api";

/** Server-side mirror of the client store defaults. */
const DEFAULTS: SettingsDTO = {
  theme: "dark",
  accentId: DEFAULT_ACCENT_ID,
  performance: "high",
  animationsEnabled: true,
  reducedTransparency: false,
  wallpaperEnabled: true,
  displayName: "Operator",
};

function toDTO(doc: SettingsDoc): SettingsDTO {
  return {
    theme: doc.theme,
    accentId: doc.accentId,
    performance: doc.performance,
    animationsEnabled: doc.animationsEnabled,
    reducedTransparency: doc.reducedTransparency,
    wallpaperEnabled: doc.wallpaperEnabled,
    displayName: doc.displayName,
  };
}

function validate(body: unknown): SettingsDTO {
  const input = asObject(body);
  return {
    theme: oneOf(input.theme ?? DEFAULTS.theme, ["dark", "light"] as const, "theme"),
    accentId: optionalString(input.accentId, "accentId", DEFAULTS.accentId, 64),
    performance: oneOf(
      input.performance ?? DEFAULTS.performance,
      ["high", "balanced", "battery"] as const,
      "performance"
    ),
    animationsEnabled: optionalBoolean(input.animationsEnabled, "animationsEnabled", true),
    reducedTransparency: optionalBoolean(input.reducedTransparency, "reducedTransparency", false),
    wallpaperEnabled: optionalBoolean(input.wallpaperEnabled, "wallpaperEnabled", true),
    displayName: optionalString(input.displayName, "displayName", DEFAULTS.displayName, 200),
  };
}

export const settingsService = {
  /** Get the user's settings, or the defaults if none saved yet. */
  async get(uid: string): Promise<SettingsDTO> {
    const doc = await settingsRepository.get(uid);
    return doc ? toDTO(doc) : { ...DEFAULTS };
  },

  /** Replace the user's settings (full upsert). */
  async replace(uid: string, body: unknown): Promise<SettingsDTO> {
    const dto = validate(body);
    await settingsRepository.upsert(uid, { ...dto, updatedAt: Date.now() });
    return dto;
  },
};
