import "server-only";

/**
 * AI chat history service — CRUD + snapshot sync for the AI Assistant's
 * conversations. Messages are embedded within each conversation document.
 */
import type { OptionalUnlessRequiredId } from "mongodb";
import { chatsRepository } from "@/server/repositories/chats.repository";
import type { ChatDoc, ChatMessageDoc } from "@/server/schemas/chats.schema";
import { NotFoundError } from "@/server/http/errors";
import { asArray, asObject, oneOf, optionalString, requireString } from "@/server/validation";
import { id as genId } from "@/lib/utils";
import type { ChatDTO } from "@/types/api";
import type { ChatMessage } from "@/types/ai";

const ROLES = ["user", "assistant", "system"] as const;

function messageToDoc(raw: unknown): ChatMessageDoc {
  const m = asObject(raw, "message");
  return {
    id: optionalString(m.id, "message.id", genId("msg"), 128),
    role: oneOf(m.role ?? "user", ROLES, "message.role"),
    content: optionalString(m.content, "message.content", "", 1_000_000),
    createdAt: typeof m.createdAt === "number" ? m.createdAt : Date.now(),
    ...(m.error === true ? { error: true } : {}),
  };
}

function toDTO(doc: ChatDoc): ChatDTO {
  return {
    id: doc.clientId,
    title: doc.title,
    messages: doc.messages as ChatMessage[],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toDoc(userId: string, body: unknown): OptionalUnlessRequiredId<ChatDoc> {
  const input = asObject(body);
  const now = Date.now();
  const messages = (input.messages ? asArray(input.messages, "messages") : []).map(messageToDoc);
  return {
    userId,
    clientId: optionalString(input.id, "id", genId("conv"), 128),
    title: optionalString(input.title, "title", "New chat", 500),
    messages,
    createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
    updatedAt: now,
  } as OptionalUnlessRequiredId<ChatDoc>;
}

export const chatsService = {
  async list(uid: string): Promise<ChatDTO[]> {
    const docs = await chatsRepository.list(uid, { updatedAt: -1 });
    return docs.map(toDTO);
  },

  async create(uid: string, body: unknown): Promise<ChatDTO> {
    const doc = toDoc(uid, body);
    await chatsRepository.insertOne(doc);
    return toDTO(doc as ChatDoc);
  },

  async update(uid: string, clientId: string, body: unknown): Promise<ChatDTO> {
    const input = asObject(body);
    const patch: Partial<ChatDoc> = { updatedAt: Date.now() };
    if ("title" in input) patch.title = requireString(input.title, "title", 500);
    if ("messages" in input)
      patch.messages = asArray(input.messages, "messages").map(messageToDoc);

    const ok = await chatsRepository.updateOne(uid, { clientId }, patch);
    if (!ok) throw new NotFoundError("Conversation not found.");
    const doc = await chatsRepository.findOne(uid, { clientId });
    return toDTO(doc!);
  },

  async remove(uid: string, clientId: string): Promise<void> {
    const ok = await chatsRepository.deleteOne(uid, { clientId });
    if (!ok) throw new NotFoundError("Conversation not found.");
  },

  async replaceAll(uid: string, body: unknown): Promise<ChatDTO[]> {
    const arr = asArray(body);
    const docs = arr.map((c) => toDoc(uid, c));
    await chatsRepository.replaceAll(uid, docs);
    return this.list(uid);
  },
};
