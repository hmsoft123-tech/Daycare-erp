"use client";

import { Send } from "lucide-react";

const threads = [
  {
    id: "t1",
    name: "Nadia Farooq",
    role: "Teacher · Toddler Room A",
    preview: "Hamdan had a wonderful story time today!",
    time: "2:10 PM",
    unread: 2,
  },
  {
    id: "t2",
    name: "Room A Parents",
    role: "Classroom group",
    preview: "Reminder: spirit day on Friday — wear orange!",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "t3",
    name: "Front Desk",
    role: "North Nazimabad Campus",
    preview: "July tuition invoice is ready in Payments.",
    time: "Mon",
    unread: 1,
  },
];

export default function ParentMessagesPage() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading">Messages</h1>
        <p className="mt-1 text-sm text-muted">Chat with teachers and your school</p>
      </section>

      <ul className="space-y-2">
        {threads.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-card">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600">
              {t.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-heading">{t.name}</p>
                <span className="shrink-0 text-[10px] text-muted">{t.time}</span>
              </div>
              <p className="truncate text-[11px] text-muted">{t.role}</p>
              <p className="mt-0.5 truncate text-sm text-heading/75">{t.preview}</p>
            </div>
            {t.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                {t.unread}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-card">
        <input
          placeholder="Message your school…"
          className="h-11 flex-1 rounded-xl bg-bg px-3 text-sm outline-none"
        />
        <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
