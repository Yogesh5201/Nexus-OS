/**
 * Code Studio AI transport — reuses the existing NEXUS streaming chat endpoint
 * (`POST /api/ai/chat`, Gemini with a local mock fallback). Sends a message
 * history and streams plain-text tokens back through `onToken`.
 */
export interface WireMessage {
  role: "user" | "assistant";
  content: string;
}

/** Stream a chat completion, invoking `onToken` for each decoded chunk. */
export async function streamChat(
  messages: WireMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}

/** Extract the first fenced code block from a Markdown string, if present. */
export function extractCodeBlock(markdown: string): string | null {
  const match = markdown.match(/```[a-zA-Z0-9+-]*\n([\s\S]*?)```/);
  return match ? match[1].replace(/\n$/, "") : null;
}
