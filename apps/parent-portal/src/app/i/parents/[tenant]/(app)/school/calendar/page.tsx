"use client";

import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";

const events = [
  { date: "2026-08-14", title: "Independence Day celebration", type: "Event" },
  { date: "2026-08-20", title: "Parent–teacher meetings", type: "PTM" },
  { date: "2026-08-21", title: "Parent–teacher meetings (day 2)", type: "PTM" },
  { date: "2026-09-01", title: "Term assessment week begins", type: "Assessment" },
  { date: "2026-09-06", title: "Eid-related holiday (confirm with branch)", type: "Holiday" },
  { date: "2026-09-15", title: "Open day / classroom showcase", type: "Event" },
];

export default function CalendarPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="School calendar"
        subtitle="Academic dates, holidays, events, PTMs & assessments"
      />
      <ul className="space-y-2">
        {events.map((e) => (
          <li
            key={`${e.date}-${e.title}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface p-4 shadow-card"
          >
            <div>
              <p className="text-sm font-bold text-heading">{e.title}</p>
              <p className="text-xs text-muted">{e.date}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
              {e.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
