import "server-only";

/**
 * `file_metadata` collection — metadata for a user's files AND folders (the file
 * bytes live in Backblaze B2; this tracks the tree, organization flags, and the
 * B2 object refs needed to fetch/delete those bytes).
 *
 * New fields beyond the original (name/size/type) are all OPTIONAL in the
 * validator so documents written by earlier versions keep validating; the
 * service defaults them when reading/writing.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface FileDoc {
  _id: ObjectId;
  userId: string;
  clientId: string;
  name: string;
  kind: "file" | "folder";
  parentId: string | null;
  size: number;
  type: string;
  starred: boolean;
  favorite: boolean;
  shared: boolean;
  trashed: boolean;
  trashedAt: number | null;
  /** Backblaze B2 object refs (present once bytes are uploaded). */
  b2FileId: string | null;
  b2FileName: string | null;
  storageKey: string | null;
  /** Small data-URL thumbnail (images only). */
  thumbnail: string | null;
  createdAt: number;
  updatedAt: number;
}

export const filesSchema: CollectionSchema = {
  name: COLLECTIONS.files,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "clientId", "name", "size", "type", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      clientId: { bsonType: "string" },
      name: { bsonType: "string" },
      kind: { enum: ["file", "folder"] },
      parentId: { bsonType: ["string", "null"] },
      size: { bsonType: ["double", "long", "int"] },
      type: { bsonType: "string" },
      starred: { bsonType: "bool" },
      favorite: { bsonType: "bool" },
      shared: { bsonType: "bool" },
      trashed: { bsonType: "bool" },
      trashedAt: { bsonType: ["double", "long", "int", "null"] },
      b2FileId: { bsonType: ["string", "null"] },
      b2FileName: { bsonType: ["string", "null"] },
      storageKey: { bsonType: ["string", "null"] },
      thumbnail: { bsonType: ["string", "null"] },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, clientId: 1 }, name: "user_client_unique", unique: true },
    { key: { userId: 1, updatedAt: -1 }, name: "user_updated_desc" },
    { key: { userId: 1, parentId: 1 }, name: "user_parent" },
  ],
};
