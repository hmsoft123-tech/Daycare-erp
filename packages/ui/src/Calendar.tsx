"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "./cn";
import type { CalendarEvent } from "@kinder-pilot/types";

const TYPE_DOT: Record<string, string> = {
  event: "bg-blue-400",
  ptm: "bg-purple-400",
  assessment: "bg-amber-400",
  holiday: "bg-emerald-400",
  announcement: "bg-pink-400",
  drill: "bg-red-400",
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type CalendarMonthViewProps = {
  events: CalendarEvent[];
  /** Controlled month; falls back to internal state (current month) when omitted */
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelectDate?: (date: Date, dayEvents: CalendarEvent[]) => void;
  selectedDate?: Date | null;
  /** Custom cell renderer — falls back to a dot-per-event day cell */
  renderDay?: (date: Date, dayEvents: CalendarEvent[]) => ReactNode;
  className?: string;
};

/**
 * Dumb, presentational month-grid calendar — no fetching, no store.
 * Reused across the admin planner widgets and both portals' calendar pages.
 */
export function CalendarMonthView({
  events,
  month,
  onMonthChange,
  onSelectDate,
  selectedDate,
  renderDay,
  className,
}: CalendarMonthViewProps) {
  const [internalMonth, setInternalMonth] = useState(() => startOfMonth(month ?? new Date()));
  const activeMonth = month ? startOfMonth(month) : internalMonth;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const firstWeekday = activeMonth.getDay();
    const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d));
    }
    return cells;
  }, [activeMonth]);

  const changeMonth = (delta: number) => {
    const next = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + delta, 1);
    if (onMonthChange) onMonthChange(next);
    else setInternalMonth(next);
  };

  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-lg px-2 py-1 text-sm text-[var(--muted,#637381)] hover:bg-[#F9FAFB]"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-[var(--heading,#1F2937)]">
          {activeMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-lg px-2 py-1 text-sm text-[var(--muted,#637381)] hover:bg-[#F9FAFB]"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--muted,#637381)]">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const iso = toIsoDate(date);
          const dayEvents = eventsByDate.get(iso) ?? [];
          if (renderDay) return <div key={iso}>{renderDay(date, dayEvents)}</div>;

          const isSelected = selectedDate ? toIsoDate(selectedDate) === iso : false;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate?.(date, dayEvents)}
              className={cn(
                "flex min-h-[52px] flex-col items-center rounded-lg border border-transparent p-1 text-xs hover:border-[var(--muted,#637381)]/30",
                isSelected && "border-[var(--brand-500,#6366F1)] bg-[var(--brand-50,#EEF2FF)]"
              )}
            >
              <span className="font-medium text-[var(--heading,#1F2937)]">{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="mt-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      title={e.title}
                      className={cn("h-1.5 w-1.5 rounded-full", TYPE_DOT[e.type] ?? "bg-[var(--brand-500,#6366F1)]")}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
