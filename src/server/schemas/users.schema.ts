import "server-only";

/**
 * `users` collection — one document per Firebase account, keyed by `_id = uid`.
 * Populated/refreshed from verified token claims on each authenticated session.
 */
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface UserDoc {
  _id: string; // Firebase uid
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providers: string[];
  createdAt: number;
  updatedAt: number;
}

export const usersSchema: CollectionSchema = {
  name: COLLECTIONS.users,
  jsonSchema: {
    bsonType: "object",
    required: ["_id", "createdAt", "updatedAt"],
    properties: {
      _id: { bsonType: "string" },
      email: { bsonType: ["string", "null"] },
      displayName: { bsonType: ["string", "null"] },
      photoURL: { bsonType: ["string", "null"] },
      emailVerified: { bsonType: "bool" },
      providers: { bsonType: "array", items: { bsonType: "string" } },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  indexes: [
    { key: { email: 1 }, name: "email_unique", unique: true, sparse: true },
    { key: { updatedAt: -1 }, name: "updatedAt_desc" },
  ],
};
