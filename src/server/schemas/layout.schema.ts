import "server-only";

/**
 * `desktop_layout` collection — one document per user (`_id = uid`) storing the
 * persisted window manager state (geometry + z-order) so the desktop reopens
 * exactly where the user left it across devices.
 */
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface LayoutDoc {
  _id: string; // uid
  /** Serialized WindowInstance[] from the client window store. */
  windows: Record<string, unknown>[];
  topZ: number;
  updatedAt: number;
}

export const layoutSchema: CollectionSchema = {
  name: COLLECTIONS.layout,
  jsonSchema: {
    bsonType: "object",
    required: ["_id", "windows", "topZ", "updatedAt"],
    properties: {
      _id: { bsonType: "string" },
      windows: { bsonType: "array", items: { bsonType: "object" } },
      topZ: { bsonType: ["double", "long", "int"] },
      updatedAt: timestamp,
    },
  },
  indexes: [],
};
