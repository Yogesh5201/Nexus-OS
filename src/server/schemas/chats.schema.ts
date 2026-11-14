import "server-only";

/**
 * `ai_chat_history` collection — AI Assistant conversations scoped to a user.
 * Messages are embedded (a conversation is a natural document boundary).
 */
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { CollectionSchema } from "./types";
import { timestamp } from "./types";

export interface ChatMessageDoc {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  error?: boolean;
}

export interface ChatDoc {
  _id: ObjectId;
  userId: string;
  clientId: string;
  title: string;
  messages: ChatMessageDoc[];
  createdAt: number;
  updatedAt: number;
}

export const chatsSchema: CollectionSchema = {
  name: COLLECTIONS.chats,
  jsonSchema: {
    bsonType: "object",
    required: ["userId", "clientId", "title", "messages", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      clientId: { bsonType: "string" },
      title: { bsonType: "string" },
      messages: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["id", "role", "content"],
          properties: {
            id: { bsonType: "string" },
            role: { enum: ["user", "assistant", "system"] },
            content: { bsonType: "string" },
            createdAt: timestamp,
            error: { bsonType: "bool" },
          },
        },
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  indexes: [
    { key: { userId: 1, clientId: 1 }, name: "user_client_unique", unique: true },
    { key: { userId: 1, updatedAt: -1 }, name: "user_updated_desc" },
  ],
};
