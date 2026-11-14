"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Globe,
  Search,
  ShieldAlert,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isElectron } from "@/lib/nexusBridge";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";
import {
  SEARCH_ENGINE_LABELS,
  faviconFor,
  hostOf,
  prettyUrl,
  resolveInput,
  titleFromUrl,
} from "./helpers";
import { ReaderView } from "./ReaderView";
import { NativeViewport } from "./NativeViewport";

/** Domains known to forbid framing — show the fallback immediately. */
const KNOWN_BLOCKED = [
  "google.com",
  "www.google.com",
  "youtube.com",
  "www.youtube.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "github.com",
  "amazon.com",
  "reddit.com",
  "netflix.com",
];

function isKnownBlocked(url: string): boolean {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  return KNOWN_BLOCKED.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Start / New-Tab page: search box + bookmark tiles + recent history. */
function StartPage({ tab }: { tab: Tab }) {
  const navigate = useBrowserStore((s) => s.navigate);
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const history = useBrowserStore((s) => s.history);
  const settings = useBrowserStore((s) => s.settings);
  const [q, setQ] = useState("");

  const recent = useMemo(() => history.slice(0, 8), [history]);

  const submit = () => {
    const url = resolveInput(q, settings.searchEngine);
    if (url) navigate(tab.id, url);
  };

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full max-w-2xl flex-col items-center"
      >
        <div className="accent-gradient mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
          <Globe className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-1 text-2xl font-semibold text-text">
          {tab.incognito ? "Incognito" : "Nexus Browser"}
        </h1>
        <p className="mb-8 text-sm text-muted">
          {tab.incognito
            ? "Pages you visit here won't be saved to history."
            : `Search with ${SEARCH_ENGINE_LABELS[settings.searchEngine]} or enter an address`}
        </p>

        <div className="glass-strong mb-10 flex w-full items-center gap-3 rounded-full border border-border/10 px-5 py-3 shadow-glow">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search the web"
            autoFocus
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted/60"
          />
        </div>

        {bookmarks.length > 0 && (
          <div className="mb-10 w-full">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Star className="h-3.5 w-3.5" /> Bookmarks
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bookmarks.slice(0, 8).map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(tab.id, b.url)}
                  className="glass group flex flex-col items-center gap-2 rounded-xl border border-border/10 p-3 transition hover:border-accent/40 hover:bg-glass/60"
                  title={b.url}
                >
                  <Favicon src={b.favicon} url={b.url} />
                  <span className="w-full truncate text-center text-xs text-muted group-hover:text-text">
                    {b.title || hostOf(b.url)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recent.length > 0 && !tab.incognito && (
          <div className="w-full">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Clock className="h-3.5 w-3.5" /> Recent
            </h2>
            <div className="flex flex-col gap-1">
              {recent.map((h) => (
                <button
                  key={h.id}
                  onClick={() => navigate(tab.id, h.url)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-glass/50"
                  title={h.url}
                >
                  <Favicon src={h.favicon} url={h.url} small />
                  <span className="truncate text-sm text-text">{h.title || hostOf(h.url)}</span>
                  <span className="ml-auto truncate text-xs text-muted/60">
                    {prettyUrl(h.url)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/** Small favicon image with a Globe fallback. */
function Favicon({ src, url, small }: { src?: string; url: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const resolved = src || faviconFor(url);
  const size = small ? "h-4 w-4" : "h-7 w-7";
  if (!resolved || failed) {
    return <Globe className={cn(size, "text-muted")} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt=""
      className={cn(size, "rounded")}
      onError={() => setFailed(true)}
    />
  );
}

/** Fallback shown when a site refuses to be framed. */
function BlockedPanel({ tab }: { tab: Tab }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border/10 p-8"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15">
          <ShieldAlert className="h-7 w-7 text-amber-400" />
        </div>
        <Favicon src={tab.favicon} url={tab.url} />
        <h2 className="text-lg font-semibold text-text">{hostOf(tab.url)} can’t be embedded</h2>
        <p className="text-sm leading-relaxed text-muted">
          This site blocks being shown inside another page (a common security
          setting). Open it in a real browser tab to view it.
        </p>
        <button
          onClick={() => window.open(tab.url, "_blank", "noopener,noreferrer")}
          className="accent-gradient flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
        >
          <ExternalLink className="h-4 w-4" /> Open in new tab
        </button>
      </motion.div>
    </div>
  );
}

/** The active tab's content area. */
export function Viewport({ tab }: { tab: Tab }) {
  const setTabLoading = useBrowserStore((s) => s.setTabLoading);
  const setTabMeta = useBrowserStore((s) => s.setTabMeta);
  const addHistory = useBrowserStore((s) => s.addHistory);

  const [blocked, setBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // In the Electron shell a real Chromium view handles the page — the iframe
  // block-detection below is web-only.
  const native = isElectron();

  // The key forces a fresh <iframe> per navigation (incl. reload, which bumps
  // `loading` true). We track that with a nonce derived from url + loading.
  const navKey = `${tab.url}::${tab.loading}`;

  useEffect(() => {
    if (native) return;
    if (!tab.url) {
      setBlocked(false);
      return;
    }
    // Known frame-blockers: skip the iframe attempt entirely.
    if (isKnownBlocked(tab.url)) {
      setBlocked(true);
      setTabLoading(tab.id, false);
      recordVisit();
      return;
    }
    setBlocked(false);
    // Safety timeout: if onLoad never fires, assume the frame was blocked.
    timerRef.current = setTimeout(() => {
      setBlocked(true);
      setTabLoading(tab.id, false);
    }, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey, tab.id]);

  const recordVisit = () => {
    const favicon = faviconFor(tab.url);
    setTabMeta(tab.id, { title: titleFromUrl(tab.url), favicon });
    if (!tab.incognito) {
      addHistory({
        url: tab.url,
        title: titleFromUrl(tab.url),
        favicon,
      });
    }
  };

  const onIframeLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTabLoading(tab.id, false);
    recordVisit();
  };

  if (tab.readerMode && tab.url) {
    return <ReaderView tab={tab} />;
  }

  if (!tab.url) {
    return <StartPage tab={tab} />;
  }

  // Electron: real Chromium view, positioned over a placeholder.
  if (native) {
    return <NativeViewport tab={tab} />;
  }

  return (
    <div className="relative h-full w-full bg-white">
      {blocked ? (
        <div className="absolute inset-0 bg-bg">
          <BlockedPanel tab={tab} />
        </div>
      ) : (
        <iframe
          key={navKey}
          src={tab.url}
          title={tab.title}
          onLoad={onIframeLoad}
          className="h-full w-full border-0"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
