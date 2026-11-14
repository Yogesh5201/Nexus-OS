import "server-only";

/**
 * Canonical collection names + a typed accessor. Centralizing the names here
 * keeps repositories, schema validators and index definitions in agreement.
 */
import type { Document, Collection } from "mongodb";
import { getDb } from "./mongo";

/** The ten NEXUS collections (see the schema modules for each shape). */
export const COLLECTIONS = {
  users: "users",
  settings: "settings",
  notes: "notes",
  events: "calendar_events",
  layout: "desktop_layout",
  apps: "installed_apps",
  notifications: "notifications",
  chats: "ai_chat_history",
  files: "file_metadata",
  recentFiles: "recent_files",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Get a typed collection handle by name. */
export async function getCollection<T extends Document>(
  name: CollectionName
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
