/**
 * Code Studio — first-run workspace scaffold.
 *
 * This preserves the exact starter project the old single-file Code Studio
 * shipped (Hello NEXUS card with a click counter), now expressed as real files
 * in the virtual file system so the explorer/tabs/preview all have something to
 * show on first launch.
 */
import type { VNode } from "../types";

/** Stable ids so re-seeding is idempotent and tabs can reference them. */
export const SEED_IDS = {
  html: "cs_seed_html",
  css: "cs_seed_css",
  js: "cs_seed_js",
  py: "cs_seed_py",
} as const;

const HTML = `<div class="card">
  <h1>Hello, NEXUS</h1>
  <p>Edit HTML, CSS &amp; JS — preview updates live.</p>
  <button id="btn">Click me</button>
</div>`;

const CSS = `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: radial-gradient(circle at 30% 20%, #1b2440, #06080f);
  color: #eef2ff;
}
.card {
  text-align: center;
  padding: 2rem 2.5rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(120deg, #38bdf8, #a78bfa);
  color: #04050c;
  font-weight: 600;
  cursor: pointer;
}`;

const JS = `const btn = document.getElementById('btn');
let count = 0;
btn.addEventListener('click', () => {
  count++;
  console.log('Clicked', count, 'times');
  btn.textContent = 'Clicked ' + count + 'x';
});`;

const PY = `# Real Python, running in your browser via Pyodide.
# Open this file and press Ctrl+Enter (or the Run button) to execute it.
import sys

def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("Python", sys.version.split()[0])
print("First 10 Fibonacci numbers:")
print([fib(i) for i in range(10)])
`;

/**
 * Build the seed workspace. A flat 3-file project at the root — the same
 * html/css/js the app opened with before, so existing behaviour is preserved.
 */
export function seedWorkspace(): VNode[] {
  const now = Date.now();
  const file = (id: string, name: string, content: string): VNode => ({
    id,
    name,
    kind: "file",
    parentId: null,
    content,
    createdAt: now,
    updatedAt: now,
  });
  return [
    file(SEED_IDS.html, "index.html", HTML),
    file(SEED_IDS.css, "styles.css", CSS),
    file(SEED_IDS.js, "script.js", JS),
    file(SEED_IDS.py, "main.py", PY),
  ];
}
