export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Search-suggestion proxy (public, unauthed — like /api/ai/chat).
 *
 * Server-fetches DuckDuckGo's autocomplete endpoint and returns a plain
 * `string[]` of suggestions. Proxied server-side to dodge browser CORS;
 * returns `[]` on any error so the address bar degrades silently.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json([]);

  try {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
      {
        headers: {
          Accept: "application/json",
          // DuckDuckGo rejects requests without a browser-like UA.
          "User-Agent":
            "Mozilla/5.0 (compatible; NexusBrowser/1.0; +https://nexus.local)",
        },
        // Don't let a slow upstream hang the address bar.
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!res.ok) return Response.json([]);

    // DDG `type=list` returns: ["query", ["sug1", "sug2", ...]]
    const data = (await res.json()) as unknown;
    let suggestions: string[] = [];
    if (Array.isArray(data) && Array.isArray(data[1])) {
      suggestions = (data[1] as unknown[]).filter(
        (s): s is string => typeof s === "string"
      );
    }
    return Response.json(suggestions.slice(0, 8));
  } catch {
    return Response.json([]);
  }
}
