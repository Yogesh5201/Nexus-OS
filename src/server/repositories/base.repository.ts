import "server-only";

/**
 * Base repository — the foundation of the repository pattern used across NEXUS.
 * Holds a collection name and exposes a typed collection handle to subclasses.
 * Concrete repositories (and the scoped/singleton bases) build on top of it.
 */
import type { Collection, Document } from "mongodb";
import { getCollection, type CollectionName } from "@/server/db/collections";

export abstract class BaseRepository<TDoc extends Document> {
  constructor(protected readonly name: CollectionName) {}

  /** Typed handle to the underlying MongoDB collection. */
  protected col(): Promise<Collection<TDoc>> {
    return getCollection<TDoc>(this.name);
  }
}
