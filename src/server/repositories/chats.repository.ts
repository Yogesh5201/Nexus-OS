import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { ChatDoc } from "@/server/schemas/chats.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `ai_chat_history` collection. */
class ChatsRepository extends UserScopedRepository<ChatDoc> {
  constructor() {
    super(COLLECTIONS.chats);
  }
}

export const chatsRepository = new ChatsRepository();
