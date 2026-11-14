import "server-only";

/**
 * `notes` collection — markdown notes scoped to a user. Folder identity is
 * denormalized onto each note (`folderId` + `folderName`) so the notes UI can
 * reconstruct its folder list without a separate collection.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface NoteDoc {
  _id: ObjectId;
  userId: string;
  /** Original client-generated id (e.g. "note_x") for client⇄server mapping. */
  clientId: string;
  folderId: string;
  folderName: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const notesSchema: CollectionSchema = {
  name: COLLECTIONS.notes,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "clientId", "folderId", "title", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      clientId: { bsonType: "string" },
      folderId: { bsonType: "string" },
      folderName: { bsonType: "string" },
      title: { bsonType: "string" },
      content: { bsonType: "string" },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, clientId: 1 }, name: "user_client_unique", unique: true },
    { key: { userId: 1, updatedAt: -1 }, name: "user_updated_desc" },
    { key: { userId: 1, folderId: 1 }, name: "user_folder" },
  ],
};
