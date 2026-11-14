export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReaderResult {
  ok: boolean;
  title: string;
  markdown: string;
  error?: string;
}

/** Decode the handful of HTML entities that survive tag-stripping. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

/**
 * Convert a fetched HTML document into readable Markdown-ish text.
 * Deliberately dependency-free (no cheerio): drop scripts/styles, lift
 * headings, then collapse remaining tags to plain paragraphs.
 */
function htmlToReadable(html: string): { title: string; markdown: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";

  // Prefer the <body> / <article> region; fall back to the whole document.
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  let region = articleMatch?.[0] ?? bodyMatch?.[0] ?? html;

  // Remove non-content elements entirely.
  region = region
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Headings → markdown.
  region = region
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<\/(p|div|section|article|ul|ol|tr|br)[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Strip all remaining tags, decode entities, normalise whitespace.
  const text = decodeEntities(region.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();

  return { title, markdown: text };
}

/**
 * Reader-mode proxy: server-fetch a page and return cleaned, readable text.
 * Public/unauthed (read-only fetch of public web pages).
 */
export async function GET(req: Request): Promise<Response> {
  const target = new URL(req.url).searchParams.get("url")?.trim() ?? "";

  let parsed: URL;
  try {
    parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    return Response.json(
      { ok: false, title: "", markdown: "", error: "Invalid URL" } satisfies ReaderResult,
      { status: 400 }
    );
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        // Identify as a normal browser so servers return real HTML.
        "User-Agent":
          "Mozilla/5.0 (compatible; NexusBrowser/1.0; +https://nexus.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return Response.json({
        ok: false,
        title: "",
        markdown: "",
        error: `Upstream responded ${res.status}`,
      } satisfies ReaderResult);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      return Response.json({
        ok: false,
        title: "",
        markdown: "",
        error: "Not an HTML page",
      } satisfies ReaderResult);
    }

    const html = await res.text();
    const { title, markdown } = htmlToReadable(html);

    if (!markdown) {
      return Response.json({
        ok: false,
        title,
        markdown: "",
        error: "No readable content found",
      } satisfies ReaderResult);
    }

    return Response.json({ ok: true, title, markdown } satisfies ReaderResult);
  } catch {
    return Response.json({
      ok: false,
      title: "",
      markdown: "",
      error: "Could not load this page for reading",
    } satisfies ReaderResult);
  }
}
