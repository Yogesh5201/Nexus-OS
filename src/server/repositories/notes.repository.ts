import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { NoteDoc } from "@/server/schemas/notes.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `notes` collection. */
class NotesRepository extends UserScopedRepository<NoteDoc> {
  constructor() {
    super(COLLECTIONS.notes);
  }

  /** Distinct folders (id + name) derived from a user's notes. */
  async listFolders(userId: string): Promise<{ id: string; name: string }[]> {
    const col = await this.col();
    const rows = await col
      .find(this.scoped(userId), { projection: { folderId: 1, folderName: 1 } })
      .toArray();
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.folderId, r.folderName ?? r.folderId);
    return [...map].map(([id, name]) => ({ id, name }));
  }
}

export const notesRepository = new NotesRepository();
