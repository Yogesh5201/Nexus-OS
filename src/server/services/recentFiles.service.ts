import "server-only";

/**
 * Recent files service — a recency-ordered, trimmed list of recently accessed
 * files. Recording an access upserts the entry and trims to a fixed cap.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { recentFilesRepository } from "@/server/repositories/recentFiles.repository";
import type { RecentFileDoc } from "@/server/schemas/recentFiles.schema";
import { asArray, asObject, optionalString, requireString } from "@/server/validation";
import type { RecentFileDTO } from "@/types/api";

const MAX_RECENT = 20;

function toDTO(doc: RecentFileDoc): RecentFileDTO {
  return { fileId: doc.fileId, name: doc.name, type: doc.type, accessedAt: doc.accessedAt };
}

function parse(body: unknown): { fileId: string; name: string; type: string; accessedAt: number } {
  const input = asObject(body);
  return {
    fileId: requireString(input.fileId, "fileId", 128),
    name: requireString(input.name, "name", 500),
    type: optionalString(input.type, "type", "application/octet-stream", 200),
    accessedAt: typeof input.accessedAt === "number" ? input.accessedAt : Date.now(),
  };
}

export const recentFilesService = {
  async list(uid: string): Promise<RecentFileDTO[]> {
    const docs = await recentFilesRepository.list(uid, { accessedAt: -1 });
    return docs.map(toDTO);
  },

  /** Record a file access (upsert + trim). */
  async record(uid: string, body: unknown): Promise<RecentFileDTO[]> {
    const entry = parse(body);
    await recentFilesRepository.touch(uid, entry);
    await recentFilesRepository.trim(uid, MAX_RECENT);
    return this.list(uid);
  },

  async replaceAll(uid: string, body: unknown): Promise<RecentFileDTO[]> {
    const arr = asArray(body).slice(0, MAX_RECENT);
    const docs = arr.map((r) => {
      const e = parse(r);
      return { userId: uid, ...e } as OptionalUnlessRequiredId<RecentFileDoc>;
    });
    await recentFilesRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
