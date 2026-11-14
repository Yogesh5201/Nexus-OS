import "server-only";

/**
 * `recent_files` collection — a per-user, recency-ordered list of recently
 * accessed files. One entry per file (re-accessing bumps `accessedAt`); the
 * service trims the list to a fixed cap.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface RecentFileDoc {
  _id: ObjectId;
  userId: string;
  /** clientId of the referenced file. */
  fileId: string;
  name: string;
  type: string;
  accessedAt: number;
}

export const recentFilesSchema: CollectionSchema = {
  name: COLLECTIONS.recentFiles,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "fileId", "name", "accessedAt"],
    properties: {
      userId: { bsonType: "string" },
      fileId: { bsonType: "string" },
      name: { bsonType: "string" },
      type: { bsonType: "string" },
      accessedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, fileId: 1 }, name: "user_file_unique", unique: true },
    { key: { userId: 1, accessedAt: -1 }, name: "user_accessed_desc" },
  ],
};
