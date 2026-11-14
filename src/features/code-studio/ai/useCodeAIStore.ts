"use client";

import { create } from "zustand";
import { id as genId } from "@/lib/utils";

/** A single message in the Code Studio AI conversation. */
export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  /** Text sent to / received from the model (used for history + Apply). */
  content: string;
  /** Optional friendlier label to render instead of `content` (e.g. actions). */
  display?: string;
  /** Whether this assistant reply is expected to contain applyable code. */
  code?: boolean;
  streaming?: boolean;
  createdAt: number;
}

interface CodeAIState {
  messages: AiMessage[];
  busy: boolean;
  addUser: (content: string, display?: string) => void;
  startAssistant: (code?: boolean) => string;
  appendAssistant: (msgId: string, token: string) => void;
  finishAssistant: (msgId: string) => void;
  setBusy: (busy: boolean) => void;
  clear: () => void;
}

/** Transient (not persisted) AI conversation state for Code Studio. */
export const useCodeAIStore = create<CodeAIState>((set) => ({
  messages: [],
  busy: false,

  addUser: (content, display) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: genId("aim"), role: "user", content, display, createdAt: Date.now() },
      ],
    })),

  startAssistant: (code) => {
    const msgId = genId("aim");
    set((s) => ({
      messages: [
        ...s.messages,
        { id: msgId, role: "assistant", content: "", code, streaming: true, createdAt: Date.now() },
      ],
    }));
    return msgId;
  },

  appendAssistant: (msgId, token) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId ? { ...m, content: m.content + token } : m
      ),
    })),

  finishAssistant: (msgId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === msgId ? { ...m, streaming: false } : m
      ),
    })),

  setBusy: (busy) => set({ busy }),
  clear: () => set({ messages: [], busy: false }),
}));
