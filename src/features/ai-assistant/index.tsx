"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Plus, SendHorizontal, Sparkles, Trash2, User } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { id, cn, timeAgo } from "@/lib/utils";
import type { ChatMessage } from "@/types/ai";

const SUGGESTIONS = [
  "Write a React hook for dark mode",
  "Summarize the theory of relativity",
  "Brainstorm names for a space startup",
  "Explain async/await in JavaScript",
];

/** AI Assistant — streaming chat with conversation history. */
export default function AIAssistant() {
  const {
    conversations,
    activeId,
    newConversation,
    deleteConversation,
    setActive,
    addMessage,
    appendToMessage,
    finalizeMessage,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;

      // Ensure there's an active conversation.
      let convId = activeId;
      if (!convId) convId = newConversation();

      const userMsg: ChatMessage = {
        id: id("msg"),
        role: "user",
        content,
        createdAt: Date.now(),
      };
      addMessage(convId, userMsg);
      setInput("");

      const assistantId = id("msg");
      addMessage(convId, {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      });

      setBusy(true);
      try {
        // Build the message history snapshot to send.
        const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
        const payload = (conv?.messages ?? [])
          .filter((m) => !m.streaming)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        // Stream tokens into the assistant message.
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          appendToMessage(convId, assistantId, decoder.decode(value, { stream: true }));
        }
        finalizeMessage(convId, assistantId);
      } catch {
        appendToMessage(
          convId,
          assistantId,
          "⚠️ Something went wrong reaching the AI service. Please try again."
        );
        finalizeMessage(convId, assistantId, true);
      } finally {
        setBusy(false);
      }
    },
    [activeId, busy, newConversation, addMessage, appendToMessage, finalizeMessage]
  );

  // Allow the command palette to hand off a query.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) send(detail);
    };
    window.addEventListener("nexus:ask-ai", handler as EventListener);
    return () => window.removeEventListener("nexus:ask-ai", handler as EventListener);
  }, [send]);

  return (
    <div className="flex h-full w-full bg-bg/30">
      {/* Conversation sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/10 bg-glass/20 p-2 sm:flex">
        <Button
          variant="secondary"
          size="sm"
          className="mb-2 justify-start"
          onClick={() => newConversation()}
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                c.id === activeId ? "bg-accent/15 text-text" : "text-muted hover:bg-glass/50"
              )}
            >
              <Bot className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <Trash2
                className="h-3 w-3 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                }}
              />
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-muted/70">No conversations yet</p>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyState onPick={send} />
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border/10 p-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message NEXUS AI…  (Enter to send)"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border/10 bg-glass/40 px-3.5 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Button
              variant="primary"
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={busy || !input.trim()}
              onClick={() => send(input)}
              aria-label="Send"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
      <div className="accent-gradient mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
        <Sparkles className="h-7 w-7 text-black/80" />
      </div>
      <h2 className="text-lg font-semibold text-text">How can I help?</h2>
      <p className="mt-1 text-sm text-muted">
        Ask anything — generate code, summarize, or brainstorm.
      </p>
      <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-xl border border-border/10 bg-glass/30 px-3 py-2.5 text-left text-xs text-muted transition-all hover:border-accent/40 hover:text-text"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-glass/60" : "accent-gradient"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-muted" />
        ) : (
          <Bot className="h-4 w-4 text-black/80" />
        )}
      </div>
      <div className={cn("min-w-0 max-w-[85%]", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-3.5 py-2.5 text-left",
            isUser ? "bg-accent/15 text-text" : "glass"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : message.content ? (
            <Markdown content={message.content} />
          ) : (
            <TypingDots />
          )}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse-glow rounded-sm bg-accent align-middle" />
          )}
        </div>
        <div className="mt-1 px-1 text-[10px] text-muted/60">{timeAgo(message.createdAt)}</div>
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
