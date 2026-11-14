"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { id } from "@/lib/utils";

export interface CalEvent {
  id: string;
  /** ISO date key: YYYY-MM-DD */
  date: string;
  title: string;
  time: string;
  color: string;
}

export const EVENT_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

interface CalendarStore {
  events: CalEvent[];
  addEvent: (date: string, title: string) => void;
  removeEvent: (id: string) => void;
}

/** Seed with two sample events on today's date (first run only). */
function seed(): CalEvent[] {
  const today = dateKey(new Date());
  return [
    { id: "1", date: today, title: "Design review", time: "10:00", color: EVENT_COLORS[0] },
    { id: "2", date: today, title: "Ship NEXUS build", time: "16:30", color: EVENT_COLORS[1] },
  ];
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: seed(),

      addEvent: (date, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          events: [
            ...s.events,
            {
              id: id("evt"),
              date,
              title: trimmed,
              time: "12:00",
              color: EVENT_COLORS[s.events.length % EVENT_COLORS.length],
            },
          ],
        }));
      },

      removeEvent: (evtId) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== evtId) })),
    }),
    { name: "nexus.calendar" }
  )
);
