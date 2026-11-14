/**
 * Local fallback "AI" used when no GEMINI_API_KEY is configured.
 * It produces context-aware, deterministic responses so the assistant is
 * fully functional offline (great for demos / first-run experience).
 */

interface MockReply {
  match: RegExp;
  reply: (q: string) => string;
}

const REPLIES: MockReply[] = [
  {
    match: /\b(hi|hello|hey|greetings)\b/i,
    reply: () =>
      "Hello! I'm **NEXUS AI**, your in-browser copilot. I'm currently running in local mode. Add a `GEMINI_API_KEY` to `.env.local` to unlock live Google Gemini responses. Meanwhile, ask me to generate code, summarize text, or brainstorm ideas.",
  },
  {
    match: /\b(code|function|component|react|javascript|python|typescript)\b/i,
    reply: (q) =>
      `Here's a starting point based on your request:\n\n\`\`\`tsx\n// ${q.slice(0, 60)}\nexport function Example() {\n  return <div className="p-4 rounded-xl">Hello from NEXUS</div>;\n}\n\`\`\`\n\nConnect a Gemini API key for tailored, production-ready code generation.`,
  },
  {
    match: /\b(summar|tldr|explain)\b/i,
    reply: () =>
      "**Summary:** I can condense long text into key points, explain concepts step by step, and highlight action items. Paste your content and I'll break it down. (Live summarization activates with a Gemini API key.)",
  },
  {
    match: /\b(idea|brainstorm|suggest|plan)\b/i,
    reply: () =>
      "Here are a few directions to explore:\n\n1. **Define the core goal** — what outcome matters most?\n2. **List constraints** — time, budget, tools.\n3. **Generate 3 distinct approaches** and compare trade-offs.\n4. **Pick one and prototype fast.**\n\nWant me to expand any of these?",
  },
];

const DEFAULT_REPLY =
  "I'm running in **local mode** right now. I can still help you explore NEXUS — try asking me to write code, summarize text, or brainstorm. To enable live AI, add a `GEMINI_API_KEY` to your `.env.local` file and restart the dev server.";

export function getMockReply(userMessage: string): string {
  const found = REPLIES.find((r) => r.match.test(userMessage));
  return found ? found.reply(userMessage) : DEFAULT_REPLY;
}
