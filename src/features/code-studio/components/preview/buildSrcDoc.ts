/**
 * Compose the live-preview document for a web project.
 *
 * Preserves the exact console bridge the original Code Studio used: it patches
 * console.log/info/warn/error + window.onerror and postMessages
 * `{ __nexus: true, type, msg }` to the parent, which the Console panel renders.
 *
 * Resolution rules (Phase 1 — flat/simple projects):
 *   - HTML entry: a root `index.html`, else the first `.html` file.
 *   - Inlines every `.css` file into <style> and every `.js` file into <script>.
 *   - If the entry is a full document (<html> present) the styles/scripts +
 *     bridge are injected into it; otherwise the entry is treated as a <body>
 *     fragment (the original behaviour).
 */
import type { VNode } from "../../types";
import { extOf } from "../../data/languages";

const BRIDGE = `<script>
  const send = (type, args) => parent.postMessage({ __nexus: true, type, msg: args.map(a => {
    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch { return String(a); }
  }).join(' ') }, '*');
  ['log','error','warn','info','debug'].forEach(k => { const o = console[k]; console[k] = (...a) => { send(k, a); o.apply(console, a); }; });
  window.onerror = (m) => send('error', [m]);
  window.addEventListener('unhandledrejection', (e) => send('error', ['Unhandled rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)]));
<\/script>`;

function filesByExt(nodes: VNode[], exts: string[]): VNode[] {
  return nodes
    .filter((n) => n.kind === "file" && exts.includes(extOf(n.name)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Find the HTML entry file, preferring a root `index.html`. */
export function htmlEntry(nodes: VNode[]): VNode | null {
  const htmls = filesByExt(nodes, ["html", "htm", "xhtml"]);
  if (htmls.length === 0) return null;
  const rootIndex = htmls.find(
    (n) => n.parentId === null && n.name.toLowerCase() === "index.html"
  );
  return rootIndex ?? htmls.find((n) => n.name.toLowerCase() === "index.html") ?? htmls[0];
}

/** Build the srcDoc string, or null when there's no HTML to render. */
export function buildSrcDoc(nodes: VNode[]): string | null {
  const entry = htmlEntry(nodes);
  if (!entry) return null;

  const css = filesByExt(nodes, ["css"])
    .map((n) => n.content ?? "")
    .join("\n");
  const js = filesByExt(nodes, ["js", "mjs", "cjs"])
    .map((n) => n.content ?? "")
    .join("\n;\n");

  const styleTag = css ? `<style>${css}</style>` : "";
  const scriptTag = js ? `<script>${js}<\/script>` : "";
  const html = entry.content ?? "";

  // Full document: inject into the existing <head>/<body>.
  if (/<html[\s>]/i.test(html)) {
    let doc = html;
    if (styleTag) {
      doc = /<\/head>/i.test(doc)
        ? doc.replace(/<\/head>/i, `${styleTag}</head>`)
        : `${styleTag}${doc}`;
    }
    const tail = `${BRIDGE}${scriptTag}`;
    doc = /<\/body>/i.test(doc)
      ? doc.replace(/<\/body>/i, `${tail}</body>`)
      : `${doc}${tail}`;
    return doc;
  }

  // Fragment: wrap it, matching the original Code Studio behaviour.
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${styleTag}</head>
<body>${html}
${BRIDGE}
${scriptTag}
</body></html>`;
}
