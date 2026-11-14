"use client";

import { useState } from "react";
import {
  Accessibility,
  Gauge,
  Palette,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ACCENT_PRESETS } from "@/constants/accents";
import { Switch } from "@/components/ui/Switch";
import { AccountSection } from "./AccountSection";
import { cn } from "@/lib/utils";
import type { PerformanceMode } from "@/types/settings";

type Section = "appearance" | "performance" | "animations" | "accessibility" | "account";

const NAV: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "animations", label: "Animations", icon: Wand2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "account", label: "Account", icon: User },
];

const PERF_OPTIONS: { id: PerformanceMode; label: string; desc: string }[] = [
  { id: "high", label: "High Fidelity", desc: "Maximum particles & post-processing" },
  { id: "balanced", label: "Balanced", desc: "Great visuals, lighter load" },
  { id: "battery", label: "Battery Saver", desc: "Minimal 3D, best performance" },
];

/** Settings — theme, accent, performance, animations, accessibility, account. */
export default function Settings() {
  const s = useSettingsStore();
  const [section, setSection] = useState<Section>("appearance");

  return (
    <div className="flex h-full w-full bg-bg/30">
      {/* Nav */}
      <aside className="w-48 shrink-0 border-r border-border/10 bg-glass/20 p-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
              section === n.id ? "bg-accent/15 text-text" : "text-muted hover:bg-glass/50"
            )}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {section === "appearance" && (
          <SettingsSection title="Appearance" subtitle="Customize how NEXUS looks">
            <Row label="Theme" desc="Switch between dark and light surfaces">
              <div className="flex rounded-lg bg-glass/40 p-0.5">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => s.setTheme(t)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs capitalize transition-colors",
                      s.theme === t ? "bg-accent/20 text-text" : "text-muted hover:text-text"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Row>

            <Row label="Accent color" desc="Drives gradients & glow across the OS" stack>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_PRESETS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => s.setAccent(a.id)}
                    aria-label={a.name}
                    className={cn(
                      "h-9 w-9 rounded-full transition-transform hover:scale-110",
                      s.accentId === a.id && "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent"
                    )}
                    style={{
                      background: `linear-gradient(120deg, rgb(${a.accent}), rgb(${a.accent2}))`,
                    }}
                  />
                ))}
              </div>
            </Row>

            <Row label="3D wallpaper" desc="Animated space environment behind the OS">
              <Switch checked={s.wallpaperEnabled} onCheckedChange={s.setWallpaperEnabled} />
            </Row>
          </SettingsSection>
        )}

        {section === "performance" && (
          <SettingsSection title="Performance" subtitle="Balance visuals against frame rate">
            <div className="grid gap-2">
              {PERF_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => s.setPerformance(opt.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    s.performance === opt.id
                      ? "border-accent/50 bg-accent/10"
                      : "border-border/10 bg-glass/30 hover:bg-glass/50"
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-text">{opt.label}</div>
                    <div className="text-xs text-muted">{opt.desc}</div>
                  </div>
                  {s.performance === opt.id && <Sparkles className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </div>
          </SettingsSection>
        )}

        {section === "animations" && (
          <SettingsSection title="Animations" subtitle="Control motion across the interface">
            <Row label="Enable animations" desc="Window transitions, dock magnify, micro-interactions">
              <Switch checked={s.animationsEnabled} onCheckedChange={s.setAnimationsEnabled} />
            </Row>
          </SettingsSection>
        )}

        {section === "accessibility" && (
          <SettingsSection title="Accessibility" subtitle="Make NEXUS comfortable for you">
            <Row label="Reduce transparency" desc="Use more solid surfaces for readability">
              <Switch
                checked={s.reducedTransparency}
                onCheckedChange={s.setReducedTransparency}
              />
            </Row>
            <Row label="Reduce motion" desc="Respects your system preference automatically">
              <span className="text-xs text-muted">Follows OS setting</span>
            </Row>
          </SettingsSection>
        )}

        {section === "account" && <AccountSection />}
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      <p className="mb-5 text-sm text-muted">{subtitle}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
  stack,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
  stack?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-glass/30 p-4",
        stack ? "space-y-3" : "flex items-center justify-between gap-4"
      )}
    >
      <div>
        <div className="text-sm font-medium text-text">{label}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
