"use client";

import { Moon, Settings as SettingsIcon, Sparkles, SquareArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBrowserStore,
  type SearchEngine,
} from "@/store/useBrowserStore";
import { SEARCH_ENGINE_LABELS } from "./helpers";
import { SidePanel } from "./SidePanel";

const ENGINES: SearchEngine[] = ["duckduckgo", "google", "bing"];

/** A labelled on/off row. */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: typeof Moon;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-glass/50"
    >
      <Icon className="h-4 w-4 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-text">{label}</span>
        <span className="block text-xs text-muted/70">{description}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          checked ? "bg-accent" : "bg-glass"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function SettingsPanel({
  onClose,
  dark,
  onToggleDark,
}: {
  onClose: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const settings = useBrowserStore((s) => s.settings);
  const setSettings = useBrowserStore((s) => s.setSettings);

  return (
    <SidePanel title="Settings" icon={SettingsIcon} onClose={onClose}>
      <div className="px-3 py-2">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted/70">
          Search engine
        </h3>
        <div className="flex flex-col gap-1">
          {ENGINES.map((e) => (
            <button
              key={e}
              onClick={() => setSettings({ searchEngine: e })}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                settings.searchEngine === e
                  ? "bg-accent/15 text-text"
                  : "text-muted hover:bg-glass/50 hover:text-text"
              )}
            >
              {SEARCH_ENGINE_LABELS[e]}
              {settings.searchEngine === e && (
                <span className="h-2 w-2 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="my-2 h-px bg-border/10" />

      <ToggleRow
        label="Dark mode"
        description="Theme this browser independently of the OS"
        checked={dark}
        onChange={onToggleDark}
        icon={Moon}
      />
      <ToggleRow
        label="Search suggestions"
        description="Show suggestions as you type in the address bar"
        checked={settings.suggestions}
        onChange={(v) => setSettings({ suggestions: v })}
        icon={Sparkles}
      />
      <ToggleRow
        label="Open links in new tab"
        description="Prefer opening external links in a new tab"
        checked={settings.openInNewTab}
        onChange={(v) => setSettings({ openInNewTab: v })}
        icon={SquareArrowOutUpRight}
      />
    </SidePanel>
  );
}
