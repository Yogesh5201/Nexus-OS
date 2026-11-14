"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Clock,
  Download,
  Globe,
  Lock,
  Moon,
  MoreVertical,
  RotateCw,
  Search,
  Settings as SettingsIcon,
  Star,
  Sun,
  VenetianMask,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrowserStore, type Tab } from "@/store/useBrowserStore";
import { faviconFor, prettyUrl, resolveInput, titleFromUrl } from "./helpers";
import type { PanelKey } from "./index";

interface Suggestion {
  text: string;
  kind: "history" | "search";
  url?: string;
}

export function Toolbar({
  tab,
  dark,
  onToggleDark,
  onOpenPanel,
}: {
  tab: Tab;
  dark: boolean;
  onToggleDark: () => void;
  onOpenPanel: (panel: PanelKey) => void;
}) {
  const goBack = useBrowserStore((s) => s.goBack);
  const goForward = useBrowserStore((s) => s.goForward);
  const reload = useBrowserStore((s) => s.reload);
  const navigate = useBrowserStore((s) => s.navigate);
  const addBookmark = useBrowserStore((s) => s.addBookmark);
  const removeBookmark = useBrowserStore((s) => s.removeBookmark);
  const toggleReader = useBrowserStore((s) => s.toggleReader);
  const newIncognitoTab = useBrowserStore((s) => s.newIncognitoTab);
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const history = useBrowserStore((s) => s.history);
  const settings = useBrowserStore((s) => s.settings);
  const setUi = useBrowserStore((s) => s.setUi);

  const [value, setValue] = useState(tab.url);
  const [focused, setFocused] = useState(false);
  const [remote, setRemote] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // In Electron, Chromium's real nav state wins; otherwise use the local stack.
  const canBack = tab.canGoBack ?? tab.cursor > 0;
  const canForward = tab.canGoForward ?? tab.cursor < tab.history.length - 1;
  const bookmarked = bookmarks.some((b) => b.url === tab.url) && Boolean(tab.url);

  // Reflect external navigation (back/forward/click) into the input when the
  // user isn't actively editing it.
  useEffect(() => {
    if (!focused) setValue(tab.url);
  }, [tab.url, tab.id, focused]);

  // Debounced remote suggestions from the proxy.
  useEffect(() => {
    if (!focused || !settings.suggestions) {
      setRemote([]);
      return;
    }
    const q = value.trim();
    if (!q || /^https?:\/\//i.test(q)) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/browser/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json()) as unknown;
        if (Array.isArray(data)) {
          setRemote(data.filter((s): s is string => typeof s === "string"));
        }
      } catch {
        /* aborted or offline — ignore */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, focused, settings.suggestions]);

  // Reflect the overflow menu's open state to the native-view overlay gate.
  useEffect(() => {
    setUi({ menuOpen });
  }, [menuOpen, setUi]);

  // Close the overflow menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    // Matching history first.
    for (const h of history) {
      if (out.length >= 4) break;
      if (
        h.url.toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q)
      ) {
        if (seen.has(h.url)) continue;
        seen.add(h.url);
        out.push({ text: h.title || h.url, kind: "history", url: h.url });
      }
    }
    // Then remote search suggestions.
    for (const s of remote) {
      if (out.length >= 8) break;
      if (seen.has(s)) continue;
      seen.add(s);
      out.push({ text: s, kind: "search" });
    }
    return out;
  }, [value, history, remote]);

  const go = (raw: string) => {
    const url = resolveInput(raw, settings.searchEngine);
    if (!url) return;
    navigate(tab.id, url);
    setFocused(false);
    setHighlight(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = highlight >= 0 ? suggestions[highlight] : undefined;
      if (picked?.url) go(picked.url);
      else if (picked) go(picked.text);
      else go(value);
    } else if (e.key === "Escape") {
      setValue(tab.url);
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const toggleBookmark = () => {
    if (!tab.url) return;
    if (bookmarked) removeBookmark(tab.url);
    else
      addBookmark({
        title: tab.title || titleFromUrl(tab.url),
        url: tab.url,
        favicon: tab.favicon || faviconFor(tab.url),
      });
  };

  const iconBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-glass hover:text-text disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted";

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="relative flex items-center gap-1 px-2 py-2">
      <button
        className={iconBtn}
        onClick={() => goBack(tab.id)}
        disabled={!canBack}
        title="Back"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        className={iconBtn}
        onClick={() => goForward(tab.id)}
        disabled={!canForward}
        title="Forward"
        aria-label="Forward"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
      <button
        className={iconBtn}
        onClick={() => reload(tab.id)}
        disabled={!tab.url}
        title="Reload (Ctrl+R)"
        aria-label="Reload"
      >
        <RotateCw className={cn("h-4 w-4", tab.loading && "animate-spin text-accent")} />
      </button>

      {/* Address bar */}
      <div className="relative mx-1 flex min-w-0 flex-1 items-center">
        <div
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-full border px-3 transition",
            focused
              ? "glass-strong border-accent/60 shadow-glow"
              : "glass border-border/10",
            tab.incognito && "border-violet-400/40"
          )}
        >
          <span className="shrink-0 text-muted">
            {tab.incognito ? (
              <VenetianMask className="h-3.5 w-3.5 text-violet-400" />
            ) : tab.url.startsWith("https://") ? (
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
            ) : value.trim() && !/\./.test(value) ? (
              <Search className="h-3.5 w-3.5" />
            ) : (
              <Globe className="h-3.5 w-3.5" />
            )}
          </span>
          <input
            ref={inputRef}
            data-browser-address
            value={focused ? value : tab.url ? prettyUrl(tab.url) : ""}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => {
              setFocused(true);
              setUi({ addressFocused: true });
              setValue(tab.url);
              // Select-all so typing replaces the URL, like a real browser.
              requestAnimationFrame(() => e.target.select());
            }}
            onBlur={() => {
              // Delay so a suggestion click registers before close.
              setTimeout(() => {
                setFocused(false);
                setUi({ addressFocused: false });
              }, 120);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search or enter address"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted/60"
          />
          <button
            onClick={toggleBookmark}
            disabled={!tab.url}
            className="shrink-0 text-muted transition hover:text-amber-300 disabled:opacity-30"
            title={bookmarked ? "Remove bookmark" : "Bookmark this page"}
            aria-label="Bookmark"
          >
            {bookmarked ? (
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="glass-strong absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-border/10 py-1 shadow-2xl"
            >
              {suggestions.map((s, i) => (
                <li key={`${s.kind}-${s.text}`}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (s.url) go(s.url);
                      else go(s.text);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition",
                      i === highlight ? "bg-accent/15 text-text" : "text-muted hover:bg-glass/50"
                    )}
                  >
                    {s.kind === "history" ? (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
                    ) : (
                      <Search className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{s.text}</span>
                    {s.kind === "history" && s.url && (
                      <span className="ml-auto truncate text-xs text-muted/60">
                        {prettyUrl(s.url)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Reader toggle */}
      <button
        className={cn(iconBtn, tab.readerMode && "bg-accent/15 text-accent")}
        onClick={() => toggleReader(tab.id)}
        disabled={!tab.url}
        title="Reader mode"
        aria-label="Reader mode"
      >
        <BookOpen className="h-4 w-4" />
      </button>

      {/* Overflow menu */}
      <div className="relative" ref={menuRef}>
        <button
          className={cn(iconBtn, menuOpen && "bg-glass text-text")}
          onClick={() => setMenuOpen((o) => !o)}
          title="Menu"
          aria-label="Menu"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12 }}
              className="glass-strong absolute right-0 top-10 z-40 w-52 overflow-hidden rounded-xl border border-border/10 py-1 shadow-2xl"
            >
              {[
                {
                  label: "Bookmarks",
                  icon: Bookmark,
                  onClick: () => onOpenPanel("bookmarks"),
                },
                {
                  label: "History",
                  icon: Clock,
                  onClick: () => onOpenPanel("history"),
                },
                {
                  label: "Downloads",
                  icon: Download,
                  onClick: () => onOpenPanel("downloads"),
                },
                {
                  label: "New incognito tab",
                  icon: VenetianMask,
                  onClick: () => newIncognitoTab(),
                },
                {
                  label: "Settings",
                  icon: SettingsIcon,
                  onClick: () => onOpenPanel("settings"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-muted transition hover:bg-glass/60 hover:text-text"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <div className="my-1 h-px bg-border/10" />
              <button
                onClick={() => {
                  onToggleDark();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-muted transition hover:bg-glass/60 hover:text-text"
              >
                <span className="flex items-center gap-3">
                  {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Dark mode
                </span>
                <span
                  className={cn(
                    "relative h-4 w-7 rounded-full transition",
                    dark ? "bg-accent" : "bg-glass"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
                      dark ? "left-3.5" : "left-0.5"
                    )}
                  />
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
