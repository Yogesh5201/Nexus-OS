import "server-only";

/**
 * Shared shape for a collection's schema module. Each schema file declares its
 * MongoDB `$jsonSchema` validator and its indexes; `db/indexes.ts` consumes them
 * to create/validate every collection idempotently.
 */
import type { Document, IndexDescription } from "mongodb";
import type { CollectionName } from "@/server/db/collections";

export interface CollectionSchema {
  /** Collection name (from COLLECTIONS). */
  name: CollectionName;
  /** Body of the `$jsonSchema` collection validator. */
  jsonSchema: Document;
  /** Indexes to ensure for this collection. */
  indexes: IndexDescription[];
}

/** Epoch-millis timestamp validator fragment (matches client `Date.now()`). */
export const timestamp = { bsonType: ["double", "long", "int"] } as const;
