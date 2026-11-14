import "server-only";

/**
 * Notes service — CRUD + snapshot sync for a user's notes. Notes are addressed
 * by their client id (`clientId`); folders are derived from the notes.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { notesRepository } from "@/server/repositories/notes.repository";
import type { NoteDoc } from "@/server/schemas/notes.schema";
import { NotFoundError } from "@/server/http/errors";
import { asArray, asObject, optionalString, requireString } from "@/server/validation";
import { id as genId } from "@/lib/utils";
import type { NoteDTO, NotesPayload } from "@/types/api";

function toDTO(doc: NoteDoc): NoteDTO {
  return {
    id: doc.clientId,
    folderId: doc.folderId,
    folderName: doc.folderName,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Validate + normalize a note payload into a full document for `userId`. */
function toDoc(userId: string, body: unknown): OptionalUnlessRequiredId<NoteDoc> {
  const input = asObject(body);
  const now = Date.now();
  return {
    userId,
    clientId: optionalString(input.id, "id", genId("note"), 128),
    folderId: optionalString(input.folderId, "folderId", "general", 128),
    folderName: optionalString(input.folderName, "folderName", "General", 200),
    title: optionalString(input.title, "title", "Untitled", 500),
    content: optionalString(input.content, "content", "", 1_000_000),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
    updatedAt: now,
  } as OptionalUnlessRequiredId<NoteDoc>;
}

export const notesService = {
  async list(uid: string): Promise<NotesPayload> {
    const docs = await notesRepository.list(uid, { updatedAt: -1 });
    const folders = await notesRepository.listFolders(uid);
    return { notes: docs.map(toDTO), folders };
  },

  async create(uid: string, body: unknown): Promise<NoteDTO> {
    const doc = toDoc(uid, body);
    await notesRepository.insertOne(doc);
    return toDTO(doc as NoteDoc);
  },

  async update(uid: string, clientId: string, body: unknown): Promise<NoteDTO> {
    const input = asObject(body);
    const patch: Partial<NoteDoc> = { updatedAt: Date.now() };
    if ("title" in input) patch.title = requireString(input.title, "title", 500);
    if ("content" in input) patch.content = optionalString(input.content, "content", "", 1_000_000);
    if ("folderId" in input) patch.folderId = requireString(input.folderId, "folderId", 128);
    if ("folderName" in input)
      patch.folderName = optionalString(input.folderName, "folderName", "General", 200);

    const ok = await notesRepository.updateOne(uid, { clientId }, patch);
    if (!ok) throw new NotFoundError("Note not found.");
    const doc = await notesRepository.findOne(uid, { clientId });
    return toDTO(doc!);
  },

  async remove(uid: string, clientId: string): Promise<void> {
    const ok = await notesRepository.deleteOne(uid, { clientId });
    if (!ok) throw new NotFoundError("Note not found.");
  },

  /** Snapshot replace (sync push). */
  async replaceAll(uid: string, body: unknown): Promise<NotesPayload> {
    const arr = asArray(body);
    const docs = arr.map((n) => toDoc(uid, n));
    await notesRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
