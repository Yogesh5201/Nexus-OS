import "server-only";

/**
 * User-scoped repository — for "many documents per user" collections.
 *
 * SECURITY: every read/write is forced to include `{ userId }`, so a caller can
 * only ever touch their own documents. This is the single chokepoint that
 * guarantees cross-user isolation regardless of what filter a service passes.
 */
import type {
  Document,
  Filter,
  MatchKeysAndValues,
  OptionalUnlessRequiredId,
  Sort,
} from "mongodb";
import { BaseRepository } from "./base.repository";

export abstract class UserScopedRepository<
  TDoc extends Document & { userId: string },
> extends BaseRepository<TDoc> {
  /** Merge a caller filter with the mandatory user scope. */
  protected scoped(userId: string, filter: Filter<TDoc> = {}): Filter<TDoc> {
    return { ...filter, userId } as Filter<TDoc>;
  }

  /** List all of a user's documents, optionally sorted. */
  async list(userId: string, sort?: Sort): Promise<TDoc[]> {
    const col = await this.col();
    const cursor = col.find(this.scoped(userId));
    if (sort) cursor.sort(sort);
    return cursor.toArray() as Promise<TDoc[]>;
  }

  /** Find one of a user's documents. */
  async findOne(userId: string, filter: Filter<TDoc>): Promise<TDoc | null> {
    const col = await this.col();
    return col.findOne(this.scoped(userId, filter)) as Promise<TDoc | null>;
  }

  /** Insert a single document (which must already carry the userId). */
  async insertOne(doc: OptionalUnlessRequiredId<TDoc>): Promise<void> {
    const col = await this.col();
    await col.insertOne(doc);
  }

  /** Update one of a user's documents; returns whether a doc matched. */
  async updateOne(
    userId: string,
    filter: Filter<TDoc>,
    update: Partial<TDoc>
  ): Promise<boolean> {
    const col = await this.col();
    const res = await col.updateOne(this.scoped(userId, filter), {
      $set: update as MatchKeysAndValues<TDoc>,
    });
    return res.matchedCount > 0;
  }

  /** Delete one of a user's documents; returns whether a doc was removed. */
  async deleteOne(userId: string, filter: Filter<TDoc>): Promise<boolean> {
    const col = await this.col();
    const res = await col.deleteOne(this.scoped(userId, filter));
    return res.deletedCount > 0;
  }

  /** Remove all of a user's documents (used by replaceAll). */
  async deleteAll(userId: string): Promise<void> {
    const col = await this.col();
    await col.deleteMany(this.scoped(userId));
  }

  /**
   * Snapshot replace: atomically swap a user's documents for `docs`.
   * Used by the sync engine's debounced full-collection push.
   */
  async replaceAll(
    userId: string,
    docs: OptionalUnlessRequiredId<TDoc>[]
  ): Promise<void> {
    const col = await this.col();
    await col.deleteMany(this.scoped(userId));
    if (docs.length > 0) await col.insertMany(docs);
  }
}
