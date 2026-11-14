import type { SearchEngine } from "@/store/useBrowserStore";

/** Search-engine query templates. */
const SEARCH_URLS: Record<SearchEngine, string> = {
  duckduckgo: "https://duckduckgo.com/?q=",
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
};

export const SEARCH_ENGINE_LABELS: Record<SearchEngine, string> = {
  duckduckgo: "DuckDuckGo",
  google: "Google",
  bing: "Bing",
};

/** Build a search URL for the given engine + query. */
export function searchUrl(engine: SearchEngine, query: string): string {
  return SEARCH_URLS[engine] + encodeURIComponent(query);
}

/**
 * Decide whether raw address-bar input is a URL or a search query, and
 * return the URL to navigate to.
 * - has a scheme (http/https) → use as-is
 * - looks like a bare domain (`example.com`, `localhost:3000`) → prepend https
 * - otherwise → run it through the search engine
 */
export function resolveInput(raw: string, engine: SearchEngine): string {
  const input = raw.trim();
  if (!input) return "";

  // Explicit scheme.
  if (/^https?:\/\//i.test(input)) return input;

  // about: / data: etc. — leave alone.
  if (/^[a-z]+:\/\//i.test(input)) return input;

  const hasSpace = /\s/.test(input);
  // Domain-like: token.token (optionally with port/path) and no spaces.
  const domainLike =
    !hasSpace &&
    (/^localhost(:\d+)?(\/.*)?$/i.test(input) ||
      /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/i.test(input));

  if (domainLike) return `https://${input}`;
  return searchUrl(engine, input);
}

/** Favicon URL for a page via Google's S2 service (best-effort). */
export function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (!host) return "";
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

/** Short, human display for a URL — host + truncated path. */
export function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname}${path}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Just the hostname, or the raw string if it doesn't parse. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A reasonable tab title derived from a URL when none is known yet. */
export function titleFromUrl(url: string): string {
  if (!url) return "New Tab";
  const host = hostOf(url);
  return host || url;
}
