"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  Cloud,
  CloudRain,
  FileText,
  Flame,
  Github,
  Plus,
  Sun,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

const CODING_STATS = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 80 },
  { day: "Wed", value: 45 },
  { day: "Thu", value: 92 },
  { day: "Fri", value: 70 },
  { day: "Sat", value: 30 },
  { day: "Sun", value: 55 },
];

const RECENT_FILES = [
  { name: "index.html", app: "Code Studio", time: "2m ago" },
  { name: "Welcome to Notes", app: "Notes", time: "1h ago" },
  { name: "design-system.md", app: "Notes", time: "3h ago" },
  { name: "styles.css", app: "Code Studio", time: "yesterday" },
];

/** Dashboard — widgets: weather, tasks, recent files, GitHub & coding stats. */
export default function Dashboard() {
  const { displayName } = useUserProfile();
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Review NEXUS design system", done: true },
    { id: "2", text: "Ship the window manager", done: true },
    { id: "3", text: "Wire up the AI assistant", done: false },
    { id: "4", text: "Polish the 3D wallpaper", done: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const completed = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((t) => [...t, { id: Date.now().toString(), text, done: false }]);
    setNewTask("");
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-bg/30 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text">
          Welcome back, <span className="text-gradient">{displayName}</span>
        </h1>
        <p className="text-sm text-muted">Here&apos;s your productivity overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Weather */}
        <GlassPanel className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Weather
            </span>
            <Cloud className="h-4 w-4 text-accent" />
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-12 w-12 text-amber-300" />
            <div>
              <div className="text-3xl font-bold text-text">24°</div>
              <div className="text-xs text-muted">Partly cloudy</div>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-muted">
            {[
              { d: "Now", i: Sun, t: "24°" },
              { d: "1PM", i: Sun, t: "26°" },
              { d: "2PM", i: Cloud, t: "25°" },
              { d: "3PM", i: CloudRain, t: "22°" },
            ].map((h) => (
              <div key={h.d} className="flex flex-col items-center gap-1">
                <span>{h.d}</span>
                <h.i className="h-3.5 w-3.5 text-accent" />
                <span className="text-text">{h.t}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Task progress ring */}
        <GlassPanel className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Today&apos;s Progress
            </span>
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div>
              <div className="text-2xl font-bold text-text">
                {completed}/{tasks.length}
              </div>
              <div className="text-xs text-muted">tasks completed</div>
            </div>
          </div>
        </GlassPanel>

        {/* Streak / GitHub */}
        <GlassPanel className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              GitHub Activity
            </span>
            <Github className="h-4 w-4 text-accent" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame className="h-8 w-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-text">12</div>
                <div className="text-[11px] text-muted">day streak</div>
              </div>
            </div>
          </div>
          <ContribGrid />
        </GlassPanel>

        {/* Coding stats chart */}
        <GlassPanel className="p-4 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Coding Hours (this week)
            </span>
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <div className="flex h-36 items-end justify-between gap-2">
            {CODING_STATS.map((s) => (
              <div key={s.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="accent-gradient w-full rounded-t-md transition-all"
                    style={{ height: `${s.value}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted">{s.day}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Tasks list */}
        <GlassPanel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Tasks</span>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task…"
              className="h-8 flex-1 rounded-lg border border-border/10 bg-glass/40 px-2.5 text-xs text-text placeholder:text-muted/70 focus:border-accent/50 focus:outline-none"
            />
            <button
              onClick={addTask}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-glass/50 text-muted hover:text-text"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                }
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-glass/40"
              >
                {t.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted" />
                )}
                <span className={cn(t.done ? "text-muted line-through" : "text-text")}>
                  {t.text}
                </span>
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Recent files */}
        <GlassPanel className="p-4 md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Recent Files
            </span>
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {RECENT_FILES.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 rounded-xl bg-glass/40 p-3 transition-colors hover:bg-glass/60"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm text-text">{f.name}</div>
                  <div className="text-[11px] text-muted">
                    {f.app} · {f.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgb(var(--glass))" strokeWidth="6" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
        className="transition-all duration-500"
      />
    </svg>
  );
}

function ContribGrid() {
  // Deterministic pseudo-random contribution heatmap (no Math.random for SSR).
  const cells = Array.from({ length: 49 }, (_, i) => (i * 37) % 4);
  const shades = ["bg-glass/40", "bg-accent/30", "bg-accent/60", "bg-accent"];
  return (
    <div className="mt-3 grid grid-cols-[repeat(12,1fr)] gap-1">
      {Array.from({ length: 36 }, (_, i) => (
        <div key={i} className={cn("aspect-square rounded-[3px]", shades[cells[i % cells.length]])} />
      ))}
    </div>
  );
}
