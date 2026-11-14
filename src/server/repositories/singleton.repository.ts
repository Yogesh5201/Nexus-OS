import "server-only";

/**
 * Singleton repository — for collections with exactly one document per user,
 * keyed by `_id = uid` (users, settings, desktop_layout). Reads/writes are
 * naturally scoped by the uid key.
 */
import type { Document, Filter, MatchKeysAndValues, WithoutId } from "mongodb";
import { BaseRepository } from "./base.repository";

export abstract class SingletonRepository<
  TDoc extends Document & { _id: string },
> extends BaseRepository<TDoc> {
  /** The `{ _id: uid }` filter, typed for this collection. */
  private byId(uid: string): Filter<TDoc> {
    return { _id: uid } as unknown as Filter<TDoc>;
  }

  /** Get the user's document, or null if it doesn't exist yet. */
  async get(uid: string): Promise<TDoc | null> {
    const col = await this.col();
    return col.findOne(this.byId(uid)) as Promise<TDoc | null>;
  }

  /** Create or replace the user's document. */
  async upsert(uid: string, doc: Omit<TDoc, "_id">): Promise<void> {
    const col = await this.col();
    await col.replaceOne(
      this.byId(uid),
      { _id: uid, ...doc } as unknown as WithoutId<TDoc>,
      { upsert: true }
    );
  }

  /** Partially update the user's document, creating it if missing. */
  async patch(uid: string, update: Partial<TDoc>): Promise<void> {
    const col = await this.col();
    // On insert, MongoDB derives `_id` from the `{ _id: uid }` filter.
    await col.updateOne(
      this.byId(uid),
      { $set: update as MatchKeysAndValues<TDoc> },
      { upsert: true }
    );
  }
}
