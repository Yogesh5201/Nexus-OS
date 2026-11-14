import "server-only";

/**
 * Installed apps service — tracks which apps a user has installed and their dock
 * placement. Snapshot sync replaces the whole set.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { appsRepository } from "@/server/repositories/apps.repository";
import type { InstalledAppDoc } from "@/server/schemas/apps.schema";
import { NotFoundError } from "@/server/http/errors";
import { asArray, asObject, optionalBoolean, requireNumber, requireString } from "@/server/validation";
import type { InstalledAppDTO } from "@/types/api";

function toDTO(doc: InstalledAppDoc): InstalledAppDTO {
  return { appId: doc.appId, inDock: doc.inDock, position: doc.position };
}

function toDoc(userId: string, body: unknown, index = 0): OptionalUnlessRequiredId<InstalledAppDoc> {
  const input = asObject(body);
  return {
    userId,
    appId: requireString(input.appId, "appId", 64),
    inDock: optionalBoolean(input.inDock, "inDock", true),
    position: requireNumber(input.position ?? index, "position", { min: 0 }),
    installedAt: typeof input.installedAt === "number" ? input.installedAt : Date.now(),
  } as OptionalUnlessRequiredId<InstalledAppDoc>;
}

export const appsService = {
  async list(uid: string): Promise<InstalledAppDTO[]> {
    const docs = await appsRepository.list(uid, { position: 1 });
    return docs.map(toDTO);
  },

  async install(uid: string, body: unknown): Promise<InstalledAppDTO> {
    const doc = toDoc(uid, body);
    await appsRepository.insertOne(doc);
    return toDTO(doc as InstalledAppDoc);
  },

  async uninstall(uid: string, appId: string): Promise<void> {
    const ok = await appsRepository.deleteOne(uid, { appId });
    if (!ok) throw new NotFoundError("App not installed.");
  },

  async replaceAll(uid: string, body: unknown): Promise<InstalledAppDTO[]> {
    const arr = asArray(body);
    const docs = arr.map((a, i) => toDoc(uid, a, i));
    await appsRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
