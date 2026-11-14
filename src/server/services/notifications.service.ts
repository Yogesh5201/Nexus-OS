import "server-only";

/**
 * Notifications service — CRUD + snapshot sync + mark-all-read for a user's
 * notification feed.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { notificationsRepository } from "@/server/repositories/notifications.repository";
import type { NotificationDoc } from "@/server/schemas/notifications.schema";
import { NotFoundError } from "@/server/http/errors";
import { asArray, asObject, oneOf, optionalBoolean, optionalString, requireString } from "@/server/validation";
import { id as genId } from "@/lib/utils";
import type { NotificationDTO } from "@/types/api";

const KINDS = ["info", "success", "warning", "error"] as const;

function toDTO(doc: NotificationDoc): NotificationDTO {
  return {
    id: doc.clientId,
    title: doc.title,
    message: doc.message,
    kind: doc.kind,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}

function toDoc(userId: string, body: unknown): OptionalUnlessRequiredId<NotificationDoc> {
  const input = asObject(body);
  return {
    userId,
    clientId: optionalString(input.id, "id", genId("ntf"), 128),
    title: requireString(input.title, "title", 500),
    message: optionalString(input.message, "message", "", 2000),
    kind: oneOf(input.kind ?? "info", KINDS, "kind"),
    read: optionalBoolean(input.read, "read", false),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : Date.now(),
  } as OptionalUnlessRequiredId<NotificationDoc>;
}

export const notificationsService = {
  async list(uid: string): Promise<NotificationDTO[]> {
    const docs = await notificationsRepository.list(uid, { createdAt: -1 });
    return docs.map(toDTO);
  },

  async create(uid: string, body: unknown): Promise<NotificationDTO> {
    const doc = toDoc(uid, body);
    await notificationsRepository.insertOne(doc);
    return toDTO(doc as NotificationDoc);
  },

  async markAllRead(uid: string): Promise<void> {
    await notificationsRepository.markAllRead(uid);
  },

  async remove(uid: string, clientId: string): Promise<void> {
    const ok = await notificationsRepository.deleteOne(uid, { clientId });
    if (!ok) throw new NotFoundError("Notification not found.");
  },

  async replaceAll(uid: string, body: unknown): Promise<NotificationDTO[]> {
    const arr = asArray(body);
    const docs = arr.map((n) => toDoc(uid, n));
    await notificationsRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
