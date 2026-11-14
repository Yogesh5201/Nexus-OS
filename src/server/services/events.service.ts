import "server-only";

/**
 * Calendar events service — CRUD + snapshot sync for a user's calendar entries.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { eventsRepository } from "@/server/repositories/events.repository";
import type { EventDoc } from "@/server/schemas/events.schema";
import { NotFoundError } from "@/server/http/errors";
import { asArray, asObject, optionalString, requireString } from "@/server/validation";
import { id as genId } from "@/lib/utils";
import type { EventDTO } from "@/types/api";

function toDTO(doc: EventDoc): EventDTO {
  return { id: doc.clientId, date: doc.date, title: doc.title, time: doc.time, color: doc.color };
}

function toDoc(userId: string, body: unknown): OptionalUnlessRequiredId<EventDoc> {
  const input = asObject(body);
  const now = Date.now();
  return {
    userId,
    clientId: optionalString(input.id, "id", genId("evt"), 128),
    date: requireString(input.date, "date", 10),
    title: requireString(input.title, "title", 500),
    time: optionalString(input.time, "time", "12:00", 5),
    color: optionalString(input.color, "color", "#38bdf8", 32),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
    updatedAt: now,
  } as OptionalUnlessRequiredId<EventDoc>;
}

export const eventsService = {
  async list(uid: string): Promise<EventDTO[]> {
    const docs = await eventsRepository.list(uid, { date: 1 });
    return docs.map(toDTO);
  },

  async create(uid: string, body: unknown): Promise<EventDTO> {
    const doc = toDoc(uid, body);
    await eventsRepository.insertOne(doc);
    return toDTO(doc as EventDoc);
  },

  async update(uid: string, clientId: string, body: unknown): Promise<EventDTO> {
    const input = asObject(body);
    const patch: Partial<EventDoc> = { updatedAt: Date.now() };
    if ("title" in input) patch.title = requireString(input.title, "title", 500);
    if ("date" in input) patch.date = requireString(input.date, "date", 10);
    if ("time" in input) patch.time = optionalString(input.time, "time", "12:00", 5);
    if ("color" in input) patch.color = optionalString(input.color, "color", "#38bdf8", 32);

    const ok = await eventsRepository.updateOne(uid, { clientId }, patch);
    if (!ok) throw new NotFoundError("Event not found.");
    const doc = await eventsRepository.findOne(uid, { clientId });
    return toDTO(doc!);
  },

  async remove(uid: string, clientId: string): Promise<void> {
    const ok = await eventsRepository.deleteOne(uid, { clientId });
    if (!ok) throw new NotFoundError("Event not found.");
  },

  async replaceAll(uid: string, body: unknown): Promise<EventDTO[]> {
    const arr = asArray(body);
    const docs = arr.map((e) => toDoc(uid, e));
    await eventsRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
