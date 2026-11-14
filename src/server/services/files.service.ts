import "server-only";

/**
 * File metadata service — CRUD + snapshot sync for the File Manager. Tracks the
 * file/folder tree and organization flags; the actual bytes live in Backblaze B2
 * (see `src/server/storage/b2.ts`) and are referenced by the b2* fields here.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { filesRepository } from "@/server/repositories/files.repository";
import type { FileDoc } from "@/server/schemas/files.schema";
import { NotFoundError } from "@/server/http/errors";
import {
  asArray,
  asObject,
  oneOf,
  optionalBoolean,
  optionalString,
  requireNumber,
  requireString,
} from "@/server/validation";
import { deleteObject } from "@/server/storage/b2";
import { id as genId } from "@/lib/utils";
import type { FileDTO } from "@/types/api";

function toDTO(doc: FileDoc): FileDTO {
  return {
    id: doc.clientId,
    name: doc.name,
    kind: doc.kind ?? "file",
    parentId: doc.parentId ?? null,
    size: doc.size,
    type: doc.type,
    starred: doc.starred ?? false,
    favorite: doc.favorite ?? false,
    shared: doc.shared ?? false,
    trashed: doc.trashed ?? false,
    trashedAt: doc.trashedAt ?? null,
    b2FileId: doc.b2FileId ?? null,
    b2FileName: doc.b2FileName ?? null,
    storageKey: doc.storageKey ?? null,
    thumbnail: doc.thumbnail ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Optional string that may be explicitly null (returns null when absent). */
function optionalNullableString(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return optionalString(value, field, "", max) || null;
}

function toDoc(userId: string, body: unknown): OptionalUnlessRequiredId<FileDoc> {
  const input = asObject(body);
  const now = Date.now();
  const kind = input.kind === "folder" ? "folder" : "file";
  return {
    userId,
    clientId: optionalString(input.id, "id", genId("file"), 128),
    name: requireString(input.name, "name", 500),
    kind,
    parentId: optionalNullableString(input.parentId, "parentId", 128),
    size: requireNumber(input.size ?? 0, "size", { min: 0 }),
    type: optionalString(input.type, "type", kind === "folder" ? "folder" : "application/octet-stream", 200),
    starred: optionalBoolean(input.starred, "starred", false),
    favorite: optionalBoolean(input.favorite, "favorite", false),
    shared: optionalBoolean(input.shared, "shared", false),
    trashed: optionalBoolean(input.trashed, "trashed", false),
    trashedAt: typeof input.trashedAt === "number" ? input.trashedAt : null,
    b2FileId: optionalNullableString(input.b2FileId, "b2FileId", 256),
    b2FileName: optionalNullableString(input.b2FileName, "b2FileName", 1024),
    storageKey: optionalNullableString(input.storageKey, "storageKey", 1024),
    // Thumbnails are small data-URLs; cap generously but bound it.
    thumbnail: optionalNullableString(input.thumbnail, "thumbnail", 200_000),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : now,
  } as OptionalUnlessRequiredId<FileDoc>;
}

export const filesService = {
  async list(uid: string): Promise<FileDTO[]> {
    const docs = await filesRepository.list(uid, { updatedAt: -1 });
    return docs.map(toDTO);
  },

  /** Fetch a single file doc (used by the content upload/download routes). */
  async get(uid: string, clientId: string): Promise<FileDoc | null> {
    return filesRepository.findOne(uid, { clientId });
  },

  async create(uid: string, body: unknown): Promise<FileDTO> {
    const doc = toDoc(uid, body);
    await filesRepository.insertOne(doc);
    return toDTO(doc as FileDoc);
  },

  async update(uid: string, clientId: string, body: unknown): Promise<FileDTO> {
    const input = asObject(body);
    const patch: Partial<FileDoc> = { updatedAt: Date.now() };
    if ("name" in input) patch.name = requireString(input.name, "name", 500);
    if ("type" in input)
      patch.type = optionalString(input.type, "type", "application/octet-stream", 200);
    if ("parentId" in input) patch.parentId = optionalNullableString(input.parentId, "parentId", 128);
    if ("kind" in input) patch.kind = oneOf(input.kind, ["file", "folder"] as const, "kind");
    if ("starred" in input) patch.starred = optionalBoolean(input.starred, "starred");
    if ("favorite" in input) patch.favorite = optionalBoolean(input.favorite, "favorite");
    if ("shared" in input) patch.shared = optionalBoolean(input.shared, "shared");
    if ("trashed" in input) {
      patch.trashed = optionalBoolean(input.trashed, "trashed");
      patch.trashedAt = patch.trashed ? Date.now() : null;
    }
    if ("thumbnail" in input)
      patch.thumbnail = optionalNullableString(input.thumbnail, "thumbnail", 200_000);

    const ok = await filesRepository.updateOne(uid, { clientId }, patch);
    if (!ok) throw new NotFoundError("File not found.");
    const doc = await filesRepository.findOne(uid, { clientId });
    return toDTO(doc!);
  },

  /**
   * Record B2 object refs after a successful byte upload. Upserts: if the
   * metadata doc hasn't been synced yet (the debounced snapshot push may not
   * have run), a minimal doc is created so bytes are never orphaned. The client
   * snapshot later reconciles the full metadata (name/parent/flags).
   */
  async setStorage(
    uid: string,
    clientId: string,
    refs: {
      b2FileId: string;
      b2FileName: string;
      storageKey: string;
      size: number;
      type: string;
      name?: string;
    }
  ): Promise<FileDTO> {
    const now = Date.now();
    const ok = await filesRepository.updateOne(
      uid,
      { clientId },
      {
        b2FileId: refs.b2FileId,
        b2FileName: refs.b2FileName,
        storageKey: refs.storageKey,
        size: refs.size,
        type: refs.type,
        updatedAt: now,
      }
    );
    if (!ok) {
      const doc = toDoc(uid, {
        id: clientId,
        name: refs.name || clientId,
        kind: "file",
        size: refs.size,
        type: refs.type,
        b2FileId: refs.b2FileId,
        b2FileName: refs.b2FileName,
        storageKey: refs.storageKey,
        createdAt: now,
        updatedAt: now,
      });
      await filesRepository.insertOne(doc);
      return toDTO(doc as FileDoc);
    }
    const doc = await filesRepository.findOne(uid, { clientId });
    return toDTO(doc!);
  },

  async remove(uid: string, clientId: string): Promise<void> {
    const doc = await filesRepository.findOne(uid, { clientId });
    if (!doc) throw new NotFoundError("File not found.");
    // Free the B2 object first (best-effort) so deletes don't orphan bytes.
    if (doc.b2FileName && doc.b2FileId) {
      try {
        await deleteObject(doc.b2FileName, doc.b2FileId);
      } catch (err) {
        console.warn("[files] B2 delete failed (continuing):", (err as Error)?.message);
      }
    }
    await filesRepository.deleteOne(uid, { clientId });
  },

  async replaceAll(uid: string, body: unknown): Promise<FileDTO[]> {
    const arr = asArray(body);
    const docs = arr.map((f) => toDoc(uid, f));
    await filesRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
