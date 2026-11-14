"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";
import { hostOf } from "./helpers";

interface ReaderResult {
  ok: boolean;
  title: string;
  markdown: string;
  error?: string;
}

/**
 * Reader mode: fetch a cleaned-text version of the page from the reader proxy
 * and render it with the shared Markdown component. Degrades gracefully.
 */
export function ReaderView({ tab }: { tab: Tab }) {
  const toggleReader = useBrowserStore((s) => s.toggleReader);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<ReaderResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setResult(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/browser/reader?url=${encodeURIComponent(tab.url)}`
        );
        const data = (await res.json()) as ReaderResult;
        if (cancelled) return;
        if (data.ok && data.markdown) {
          setResult(data);
          setState("ready");
        } else {
          setResult(data);
          setState("error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab.url]);

  return (
    <div className="h-full w-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted">
          <BookOpen className="h-4 w-4 text-accent" />
          <span>Reader mode · {hostOf(tab.url)}</span>
          <button
            onClick={() => toggleReader(tab.id)}
            className="ml-auto rounded-md px-2 py-1 text-xs text-muted transition hover:bg-glass hover:text-text"
          >
            Exit reader
          </button>
        </div>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-sm">Preparing a clean reading view…</span>
          </div>
        )}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="max-w-md text-sm text-muted">
              {result?.error ?? "This page couldn’t be loaded for reading."}
            </p>
            <button
              onClick={() => window.open(tab.url, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 rounded-full border border-border/10 px-4 py-2 text-sm text-text transition hover:bg-glass"
            >
              <ExternalLink className="h-4 w-4" /> Open original
            </button>
          </motion.div>
        )}

        {state === "ready" && result && (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {result.title && (
              <h1 className="mb-6 text-2xl font-semibold leading-tight text-text">
                {result.title}
              </h1>
            )}
            <Markdown content={result.markdown} />
          </motion.article>
        )}
      </div>
    </div>
  );
}
