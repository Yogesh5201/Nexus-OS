import "server-only";

/**
 * `installed_apps` collection — which apps a user has installed and their dock
 * placement. Defaults mirror `constants/apps` so the UI is unchanged until the
 * user customizes it.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface InstalledAppDoc {
  _id: ObjectId;
  userId: string;
  appId: string;
  inDock: boolean;
  position: number;
  installedAt: number;
}

export const appsSchema: CollectionSchema = {
  name: COLLECTIONS.apps,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "appId", "installedAt"],
    properties: {
      userId: { bsonType: "string" },
      appId: { bsonType: "string" },
      inDock: { bsonType: "bool" },
      position: { bsonType: ["double", "long", "int"] },
      installedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, appId: 1 }, name: "user_app_unique", unique: true },
    { key: { userId: 1, position: 1 }, name: "user_position" },
  ],
};
