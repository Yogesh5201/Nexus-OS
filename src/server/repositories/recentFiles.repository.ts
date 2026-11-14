import "server-only";

import type { OptionalUnlessRequiredId } from "mongodb";
import { COLLECTIONS } from "@/server/db/collections";
import type { RecentFileDoc } from "@/server/schemas/recentFiles.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `recent_files` collection. */
class RecentFilesRepository extends UserScopedRepository<RecentFileDoc> {
  constructor() {
    super(COLLECTIONS.recentFiles);
  }

  /** Record (or bump) a recently-accessed file. */
  async touch(
    userId: string,
    entry: { fileId: string; name: string; type: string; accessedAt: number }
  ): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      this.scoped(userId, { fileId: entry.fileId }),
      { $set: { ...entry, userId } },
      { upsert: true }
    );
  }

  /** Keep only the `keep` most-recent entries for a user. */
  async trim(userId: string, keep: number): Promise<void> {
    const col = await this.col();
    const stale = await col
      .find(this.scoped(userId))
      .sort({ accessedAt: -1 })
      .skip(keep)
      .project({ _id: 1 })
      .toArray();
    if (stale.length > 0) {
      await col.deleteMany({ _id: { $in: stale.map((d) => d._id) } });
    }
  }

  /** Bulk insert (used by replaceAll-style sync). */
  async insertMany(docs: OptionalUnlessRequiredId<RecentFileDoc>[]): Promise<void> {
    if (docs.length === 0) return;
    const col = await this.col();
    await col.insertMany(docs);
  }
}

export const recentFilesRepository = new RecentFilesRepository();
