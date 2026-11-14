import "server-only";

/**
 * Schema & index bootstrap.
 *
 * `ensureSchema()` creates each collection with its `$jsonSchema` validator and
 * ensures all indexes exist. It is idempotent and memoized, so the first
 * authenticated request per process pays the cost and the rest are free.
 */
import type { Document } from "mongodb";
import { getDb } from "./mongo";
import type { CollectionSchema } from "@/server/schemas/types";
import { usersSchema } from "@/server/schemas/users.schema";
import { settingsSchema } from "@/server/schemas/settings.schema";
import { notesSchema } from "@/server/schemas/notes.schema";
import { eventsSchema } from "@/server/schemas/events.schema";
import { layoutSchema } from "@/server/schemas/layout.schema";
import { appsSchema } from "@/server/schemas/apps.schema";
import { notificationsSchema } from "@/server/schemas/notifications.schema";
import { chatsSchema } from "@/server/schemas/chats.schema";
import { filesSchema } from "@/server/schemas/files.schema";
import { recentFilesSchema } from "@/server/schemas/recentFiles.schema";

/** All collection schemas in one registry. */
export const ALL_SCHEMAS: CollectionSchema[] = [
  usersSchema,
  settingsSchema,
  notesSchema,
  eventsSchema,
  layoutSchema,
  appsSchema,
  notificationsSchema,
  chatsSchema,
  filesSchema,
  recentFilesSchema,
];

/** Memoized bootstrap promise so this runs at most once per process. */
let bootstrap: Promise<void> | null = null;

async function applySchema(schema: CollectionSchema): Promise<void> {
  const db = await getDb();
  const validator: Document = { $jsonSchema: schema.jsonSchema };

  const existing = await db
    .listCollections({ name: schema.name }, { nameOnly: true })
    .toArray();

  if (existing.length === 0) {
    try {
      await db.createCollection(schema.name, {
        validator,
        validationLevel: "moderate",
        validationAction: "error",
      });
    } catch (err: unknown) {
      // 48 = NamespaceExists (created concurrently); ignore, else rethrow.
      if ((err as { code?: number }).code !== 48) throw err;
    }
  } else {
    // Keep the validator in sync with the latest schema definition.
    await db.command({
      collMod: schema.name,
      validator,
      validationLevel: "moderate",
      validationAction: "error",
    });
  }

  if (schema.indexes.length > 0) {
    await db.collection(schema.name).createIndexes(schema.indexes);
  }
}

/** Ensure every collection, validator and index exists (idempotent, memoized). */
export function ensureSchema(): Promise<void> {
  if (!bootstrap) {
    bootstrap = Promise.all(ALL_SCHEMAS.map(applySchema))
      .then(() => undefined)
      .catch((err) => {
        // Reset so a transient failure can be retried on the next request.
        bootstrap = null;
        throw err;
      });
  }
  return bootstrap;
}
