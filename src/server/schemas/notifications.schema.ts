import "server-only";

/**
 * `notifications` collection — per-user notification feed, mirroring the client
 * `NexusNotification` shape.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface NotificationDoc {
  _id: ObjectId;
  userId: string;
  clientId: string;
  title: string;
  message: string;
  kind: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: number;
}

export const notificationsSchema: CollectionSchema = {
  name: COLLECTIONS.notifications,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "clientId", "title", "kind", "createdAt"],
    properties: {
      userId: { bsonType: "string" },
      clientId: { bsonType: "string" },
      title: { bsonType: "string" },
      message: { bsonType: "string" },
      kind: { enum: ["info", "success", "warning", "error"] },
      read: { bsonType: "bool" },
      createdAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, clientId: 1 }, name: "user_client_unique", unique: true },
    { key: { userId: 1, createdAt: -1 }, name: "user_created_desc" },
    { key: { userId: 1, read: 1 }, name: "user_read" },
  ],
};
