"use client";

import { useEffect, useState } from "react";
import { fetchParentOps } from "@/lib/parent-ops-api";
import { CalendarMonthView } from "@kinder-pilot/ui";
import type { CalendarEvent } from "@kinder-pilot/types";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetchParentOps<CalendarEvent>("calendar", []).then(setEvents);
  }, []);

  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Calendar</h1>
        <p className="mt-1 text-sm text-muted">Events, holidays, PTMs, and assessments</p>
      </section>
      <CalendarMonthView events={events} />
      <ul className="space-y-2">
        {upcoming.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface p-4 shadow-card"
          >
            <div>
              <p className="text-sm font-bold text-heading">{e.title}</p>
              <p className="text-xs text-muted">{e.date}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold capitalize text-brand-700">
              {e.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
