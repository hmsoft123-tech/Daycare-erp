"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, Send } from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import { fetchParentOps, postParentOps } from "@/lib/parent-ops-api";

type Thread = {
  id: string;
  withName: string;
  withRole: string;
  preview: string;
  unread: number;
  messages: { id: string; from: string; body: string; at: string }[];
};

type Ptm = {
  id: string;
  teacherName: string;
  date: string;
  time: string;
  status: string;
  parentName?: string;
  childName?: string;
};

type Note = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
};

const fallbackThreads: Thread[] = [
  {
    id: "mt1",
    withName: "Fatima Noor",
    withRole: "teacher",
    preview: "Hamdan had a wonderful story time today!",
    unread: 1,
    messages: [
      { id: "m1", from: "staff", body: "Hamdan had a wonderful story time today!", at: "" },
    ],
  },
];

export default function ParentMessagesPage() {
  const [tab, setTab] = useState<"chat" | "ptm" | "alerts">("chat");
  const [threads, setThreads] = useState(fallbackThreads);
  const [activeId, setActiveId] = useState(fallbackThreads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [slots, setSlots] = useState<Ptm[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    fetchParentOps<Thread>("messages", fallbackThreads).then((items) => {
      setThreads(items);
      if (items[0]) setActiveId(items[0].id);
    });
    fetchParentOps<Ptm>("ptm", []).then(setSlots);
    fetchParentOps<Note>("notifications", []).then(setNotes);
  }, []);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId]
  );

  const send = async () => {
    if (!active || !draft.trim()) return;
    await postParentOps({ action: "sendMessage", threadId: active.id, text: draft.trim() });
    const msg = {
      id: `local-${Date.now()}`,
      from: "parent",
      body: draft.trim(),
      at: new Date().toISOString(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, messages: [...t.messages, msg], preview: msg.body, unread: 0 }
          : t
      )
    );
    setDraft("");
    setFlash("Message sent");
  };

  const book = async (slotId: string) => {
    const ok = await postParentOps({
      action: "bookPtm",
      slotId,
      parentName: "Ayesha Khan",
      childName: "Hamdan",
    });
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, status: "booked", parentName: "Ayesha Khan", childName: "Hamdan" }
          : s
      )
    );
    setFlash(ok ? "PTM slot booked" : "Booked locally (ERP offline)");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Messages</h1>
        <p className="mt-1 text-sm text-muted">Chat · PTM booking · notifications</p>
      </section>

      {flash && (
        <p className="rounded-xl bg-soft-green px-3 py-2 text-xs font-semibold text-[#0E9F6E]">
          {flash}
        </p>
      )}

      <div className="flex gap-2">
        {(
          [
            ["chat", "Chat"],
            ["ptm", "PTM"],
            ["alerts", "Alerts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              tab === id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    "w-full rounded-2xl bg-surface p-3 text-left shadow-card",
                    activeId === t.id && "ring-2 ring-brand-400"
                  )}
                >
                  <p className="text-sm font-bold">{t.withName}</p>
                  <p className="truncate text-xs text-muted">{t.preview}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl bg-surface p-3 shadow-card">
            <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
              {active?.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    m.from === "parent"
                      ? "ml-auto bg-brand-500 text-white"
                      : "bg-bg text-heading"
                  )}
                >
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message teacher or admin…"
                className="h-11 flex-1 rounded-xl bg-bg px-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={send}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "ptm" && (
        <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {slots.map((s) => (
            <li key={s.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <CalendarClock className="h-4 w-4 text-brand-500" />
                    {s.teacherName}
                  </p>
                  <p className="text-xs text-muted">
                    {s.date} · {s.time}
                  </p>
                </div>
                <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-bold capitalize text-muted">
                  {s.status}
                </span>
              </div>
              {s.status === "open" ? (
                <button
                  type="button"
                  onClick={() => book(s.id)}
                  className="mt-3 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white"
                >
                  Book 10-min slot
                </button>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  Booked · {s.parentName} / {s.childName}
                </p>
              )}
            </li>
          ))}
          {slots.length === 0 && (
            <li className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted md:col-span-2">
              No PTM slots published yet.
            </li>
          )}
        </ul>
      )}

      {tab === "alerts" && (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold">
                <Bell className="h-4 w-4 text-brand-500" />
                {n.title}
              </p>
              <p className="mt-1 text-xs text-heading/85">{n.body}</p>
              <p className="mt-1 text-[10px] capitalize text-muted">{n.type}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
