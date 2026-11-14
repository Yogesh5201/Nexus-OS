"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/store/useCalendarStore";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Calendar — month grid with a daily agenda panel for planning. */
export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const events = useCalendarStore((s) => s.events);
  const addEventToStore = useCalendarStore((s) => s.addEvent);
  const removeEvent = useCalendarStore((s) => s.removeEvent);
  const [draft, setDraft] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build the 6x7 grid of day cells (nulls for leading blanks).
  const cells = useMemo(() => {
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDay, daysInMonth, year, month]);

  const selectedKey = dateKey(selected);
  const dayEvents = events
    .filter((e) => e.date === selectedKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const addEvent = () => {
    if (!draft.trim()) return;
    addEventToStore(selectedKey, draft);
    setDraft("");
  };

  const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

  return (
    <div className="flex h-full w-full bg-bg/30">
      {/* Month grid */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            {MONTHS[month]} <span className="text-muted">{year}</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const today = new Date();
                setCursor(today);
                setSelected(today);
              }}
              className="rounded-lg bg-glass/40 px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Today
            </button>
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-glass/40 text-muted hover:text-text"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-glass/40 text-muted hover:text-text"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-medium text-muted">
              {d}
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const key = dateKey(date);
            const dayEvts = events.filter((e) => e.date === key);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(date)}
                className={cn(
                  "flex flex-col rounded-xl border p-1.5 text-left transition-colors",
                  isSelected
                    ? "border-accent/60 bg-accent/10"
                    : "border-transparent bg-glass/20 hover:bg-glass/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday ? "accent-gradient font-semibold text-black/80" : "text-text"
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="mt-auto flex flex-wrap gap-0.5">
                  {dayEvts.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: e.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day agenda */}
      <aside className="flex w-72 shrink-0 flex-col border-l border-border/10 bg-glass/20 p-4">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wider text-muted">
            {WEEKDAYS[selected.getDay()]}
          </div>
          <div className="text-2xl font-bold text-text">
            {MONTHS[selected.getMonth()]} {selected.getDate()}
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="Add an event…"
            className="h-8 flex-1 rounded-lg border border-border/10 bg-glass/40 px-2.5 text-xs text-text placeholder:text-muted/70 focus:border-accent/50 focus:outline-none"
          />
          <button
            onClick={addEvent}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-glass/50 text-muted hover:text-text"
            aria-label="Add event"
          >
            <CalendarPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {dayEvents.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted">
              <Clock className="h-6 w-6 opacity-50" />
              <span className="text-xs">No events scheduled</span>
            </div>
          )}
          {dayEvents.map((e) => (
            <div
              key={e.id}
              className="group flex items-center gap-2.5 rounded-xl bg-glass/40 p-3"
              style={{ borderLeft: `3px solid ${e.color}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text">{e.title}</div>
                <div className="text-[11px] text-muted">{e.time}</div>
              </div>
              <Trash2
                className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                onClick={() => removeEvent(e.id)}
              />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
