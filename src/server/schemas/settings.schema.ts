import "server-only";

/**
 * `settings` collection — one document per user (`_id = uid`), mirroring the
 * client `Settings` shape so the settings store can hydrate/persist directly.
 */
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface SettingsDoc {
  _id: string; // uid
  theme: "dark" | "light";
  accentId: string;
  performance: "high" | "balanced" | "battery";
  animationsEnabled: boolean;
  reducedTransparency: boolean;
  wallpaperEnabled: boolean;
  displayName: string;
  updatedAt: number;
}

export const settingsSchema: CollectionSchema = {
  name: COLLECTIONS.settings,
  jsonSchema: {
    bsonType: "object",
    required: ["_id", "theme", "accentId", "performance", "updatedAt"],
    properties: {
      _id: { bsonType: "string" },
      theme: { enum: ["dark", "light"] },
      accentId: { bsonType: "string" },
      performance: { enum: ["high", "balanced", "battery"] },
      animationsEnabled: { bsonType: "bool" },
      reducedTransparency: { bsonType: "bool" },
      wallpaperEnabled: { bsonType: "bool" },
      displayName: { bsonType: "string" },
      updatedAt: timestamp,
    },
  },
  indexes: [],
};
