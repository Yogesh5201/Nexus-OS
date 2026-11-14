import "server-only";

/**
 * `calendar_events` collection — calendar entries scoped to a user. `date` is an
 * ISO day key (YYYY-MM-DD), matching the calendar feature's `dateKey()`.
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface EventDoc {
  _id: ObjectId;
  userId: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string; // HH:mm
  color: string;
  createdAt: number;
  updatedAt: number;
}

export const eventsSchema: CollectionSchema = {
  name: COLLECTIONS.events,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "clientId", "date", "title", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      clientId: { bsonType: "string" },
      date: { bsonType: "string" },
      title: { bsonType: "string" },
      time: { bsonType: "string" },
      color: { bsonType: "string" },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, clientId: 1 }, name: "user_client_unique", unique: true },
    { key: { userId: 1, date: 1 }, name: "user_date" },
  ],
};
