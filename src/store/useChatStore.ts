"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Conversation } from "@/types/ai";
import { id } from "@/lib/utils";

interface ChatStore {
  conversations: Conversation[];
  activeId: string | null;
  newConversation: () => string;
  deleteConversation: (id: string) => void;
  setActive: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  /** Append streamed text to an existing assistant message. */
  appendToMessage: (conversationId: string, messageId: string, delta: string) => void;
  finalizeMessage: (conversationId: string, messageId: string, error?: boolean) => void;
}

function createConversation(): Conversation {
  const now = Date.now();
  return { id: id("conv"), title: "New chat", messages: [], createdAt: now, updatedAt: now };
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,

      newConversation: () => {
        const conv = createConversation();
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }));
        return conv.id;
      },

      deleteConversation: (convId) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== convId);
          const activeId = s.activeId === convId ? conversations[0]?.id ?? null : s.activeId;
          return { conversations, activeId };
        }),

      setActive: (activeId) => set({ activeId }),

      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  // Title the conversation from its first user message.
                  title:
                    c.messages.length === 0 && message.role === "user"
                      ? message.content.slice(0, 40)
                      : c.title,
                }
              : c
          ),
        })),

      appendToMessage: (conversationId, messageId, delta) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content: m.content + delta } : m
                  ),
                }
              : c
          ),
        })),

      finalizeMessage: (conversationId, messageId, error) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, streaming: false, error: error ?? false } : m
                  ),
                }
              : c
          ),
        })),
    }),
    { name: "nexus.chat" }
  )
);
