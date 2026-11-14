import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMockReply } from "@/services/mockAI";
import type { ChatMessage } from "@/types/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are NEXUS AI, a helpful, concise and friendly assistant living inside a futuristic web operating system. Use Markdown for formatting and fenced code blocks for code. Keep answers focused.";

/** Encode a string into a stream chunk. */
function chunk(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Streaming chat endpoint.
 * - With GEMINI_API_KEY: proxies Google Gemini's streaming response.
 * - Without it: streams a local mock reply token-by-token.
 * Either way the client receives a plain-text token stream.
 */
export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const apiKey = process.env.GEMINI_API_KEY;

  // ---- Local mock mode -----------------------------------------------------
  if (!apiKey) {
    const reply = getMockReply(lastUser?.content ?? "");
    const stream = new ReadableStream({
      async start(controller) {
        // Stream word-by-word to mimic a live generation feel.
        const words = reply.split(" ");
        for (const word of words) {
          controller.enqueue(chunk(word + " "));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Nexus-Mode": "mock" },
    });
  }

  // ---- Live Gemini mode ----------------------------------------------------
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Map our messages to Gemini's chat history format (exclude the last user
    // turn, which we send as the prompt). Gemini uses "model" for assistant.
    const history = messages
      .filter((m) => m.role !== "system")
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastUser?.content ?? "");

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.stream) {
            const text = part.text();
            if (text) controller.enqueue(chunk(text));
          }
        } catch (err) {
          controller.enqueue(chunk("\n\n_[stream interrupted]_"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Nexus-Mode": "gemini" },
    });
  } catch (err) {
    return new Response(
      "NEXUS AI could not reach Gemini. Check your API key and try again.",
      { status: 502 }
    );
  }
}
