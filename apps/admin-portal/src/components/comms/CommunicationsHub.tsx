"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  appNotifications,
  messageThreads,
  ptmSlots,
  type MessageThread,
  type PtmSlot,
} from "@/data/extended-ops";
import { cn } from "@/lib/utils";

type MainTab = "messages" | "announcements" | "newsletters" | "ptm";
type Audience = "parent" | "staff";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CommunicationsHub() {
  const [mainTab, setMainTab] = useState<MainTab>("messages");
  const [audience, setAudience] = useState<Audience>("parent");
  const [threads, setThreads] = useState(messageThreads);
  const [active, setActive] = useState<MessageThread | null>(
    () => messageThreads.find((t) => t.audience === "parent") ?? messageThreads[0] ?? null
  );
  const [draft, setDraft] = useState("");
  const [slots, setSlots] = useState(ptmSlots);
  const [notes, setNotes] = useState(appNotifications);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [filterRecipient, setFilterRecipient] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");

  const unreadTotal = useMemo(() => threads.reduce((n, t) => n + t.unread, 0), [threads]);
  const parentCount = useMemo(() => threads.filter((t) => t.audience === "parent").length, [threads]);
  const staffCount = useMemo(() => threads.filter((t) => t.audience === "staff").length, [threads]);

  const rooms = useMemo(
    () => Array.from(new Set(threads.map((t) => t.roomName).filter(Boolean) as string[])),
    [threads]
  );
  const students = useMemo(
    () => Array.from(new Set(threads.map((t) => t.childName).filter(Boolean) as string[])),
    [threads]
  );
  const recipients = useMemo(
    () => Array.from(new Set(threads.filter((t) => t.audience === audience).map((t) => t.withName))),
    [threads, audience]
  );

  const filtered = useMemo(() => {
    return threads
      .filter((t) => t.audience === audience)
      .filter((t) => (filterRecipient === "all" ? true : t.withName === filterRecipient))
      .filter((t) => (filterRoom === "all" ? true : t.roomName === filterRoom))
      .filter((t) => (filterStudent === "all" ? true : t.childName === filterStudent))
      .filter((t) => {
        if (filterStatus === "unread") return t.unread > 0;
        if (filterStatus === "read") return t.unread === 0;
        return true;
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [threads, audience, filterRecipient, filterRoom, filterStudent, filterStatus]);

  const announcements = useMemo(
    () => notes.filter((n) => n.type === "announcement" || n.audience === "parent" || n.audience === "all"),
    [notes]
  );

  const openThread = (t: MessageThread) => {
    setActive(t);
    if (t.unread > 0) {
      setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x)));
      setActive({ ...t, unread: 0 });
    }
  };

  const sendReply = () => {
    if (!active || !draft.trim()) return;
    const msg = {
      id: `m-${Date.now()}`,
      from: "staff" as const,
      body: draft.trim(),
      at: new Date().toISOString(),
    };
    const updated = {
      ...active,
      messages: [...active.messages, msg],
      preview: msg.body,
      updatedAt: msg.at,
      unread: 0,
    };
    setThreads((prev) => prev.map((t) => (t.id === active.id ? updated : t)));
    setActive(updated);
    setDraft("");
    toast.success(active.audience === "parent" ? "Reply sent to parent" : "Reply sent to staff");
  };

  const createMessage = () => {
    if (!composeTo.trim() || !composeBody.trim()) return;
    const now = new Date().toISOString();
    const thread: MessageThread = {
      id: `mt-${Date.now()}`,
      audience,
      parentId: `new-${Date.now()}`,
      parentName: composeTo.trim(),
      withName: composeTo.trim(),
      withRole: audience === "parent" ? "parent" : "teacher",
      tags: audience === "parent" ? ["Parent"] : ["Staff"],
      roomName: filterRoom !== "all" ? filterRoom : "All Rooms",
      preview: composeBody.trim(),
      updatedAt: now,
      unread: 0,
      messages: [{ id: `m-${Date.now()}`, from: "staff", body: composeBody.trim(), at: now }],
    };
    setThreads((prev) => [thread, ...prev]);
    setActive(thread);
    setComposeTo("");
    setComposeBody("");
    setComposeOpen(false);
    setMainTab("messages");
    toast.success("Message created");
  };

  const bookOrOpen = (slot: PtmSlot) => {
    if (slot.status === "open") {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? { ...s, status: "booked", parentName: "Walk-in parent", childName: "TBD" }
            : s
        )
      );
      toast.success("Slot marked booked");
    }
  };

  const pushNotify = (asNewsletter = false) => {
    if (!noteTitle.trim() || !noteBody.trim()) return;
    setNotes((prev) => [
      {
        id: `n-${Date.now()}`,
        audience: "parent",
        title: noteTitle,
        body: noteBody,
        createdAt: new Date().toISOString(),
        type: asNewsletter ? "announcement" : "announcement",
      },
      ...prev,
    ]);
    setNoteTitle("");
    setNoteBody("");
    toast.success(asNewsletter ? "Newsletter published (demo)" : "Announcement sent");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-bg p-1">
          {(
            [
              ["messages", `Messages${unreadTotal ? ` (${unreadTotal})` : ""}`],
              ["announcements", "Announcements"],
              ["newsletters", "Newsletters"],
              ["ptm", "PTM"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMainTab(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold",
                mainTab === id ? "bg-white text-heading shadow-sm" : "text-muted hover:text-heading"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {mainTab === "messages" && (
          <Button type="button" onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4" /> New Message
          </Button>
        )}
      </div>

      {mainTab === "messages" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-bg p-1">
              {(
                [
                  ["parent", `Parents (${parentCount})`],
                  ["staff", `Staff (${staffCount})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setAudience(id);
                    const first = threads.find((t) => t.audience === id);
                    setActive(first ?? null);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold",
                    audience === id ? "bg-white text-heading shadow-sm" : "text-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={filterRecipient}
              onChange={(e) => setFilterRecipient(e.target.value)}
              className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
            >
              <option value="all">Recipient</option>
              {recipients.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
            >
              <option value="all">Room</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
            >
              <option value="all">Student</option>
              {students.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
            >
              <option value="all">Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <button
              type="button"
              className="text-xs font-semibold text-brand-600"
              onClick={() => {
                setFilterRecipient("all");
                setFilterRoom("all");
                setFilterStudent("all");
                setFilterStatus("all");
              }}
            >
              Reset
            </button>
            <span className="ml-auto text-xs text-muted">Order by Most recent</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <ul className="divide-y divide-[#F1F3F5] overflow-hidden rounded-2xl border border-[#F1F3F5] bg-white">
              {filtered.length === 0 && (
                <li className="p-6 text-center text-sm text-muted">No conversations</li>
              )}
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-bg",
                      active?.id === t.id && "bg-brand-50"
                    )}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {initials(t.withName)}
                      {t.unread > 0 && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-heading">{t.withName}</p>
                        <span className="shrink-0 text-[10px] text-muted">{formatWhen(t.updatedAt)}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {t.tags?.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                              tag === "Admin" && "bg-purple-100 text-purple-700",
                              tag === "Parent" && "bg-pink-100 text-pink-700",
                              tag === "Teacher" && "bg-soft-blue text-[#006C9C]",
                              tag === "Staff" && "bg-bg text-muted"
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted">{t.preview}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <Card>
              <CardContent className="space-y-3 p-4">
                {active ? (
                  <>
                    <div>
                      <p className="text-sm font-semibold">
                        {active.withName}
                        {active.childName ? ` · ${active.childName}` : ""}
                      </p>
                      <p className="text-xs text-muted">
                        {active.roomName ?? "—"} · {active.audience === "parent" ? "Parent thread" : "Staff thread"}
                      </p>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-bg p-3">
                      {active.messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                            m.from === "staff"
                              ? "ml-auto bg-brand-500 text-white"
                              : "bg-surface text-heading shadow-card"
                          )}
                        >
                          {m.body}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a reply…"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendReply();
                        }}
                      />
                      <Button type="button" onClick={sendReply}>
                        Send
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">Select a conversation</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {(mainTab === "announcements" || mainTab === "newsletters") && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">
                {mainTab === "newsletters" ? "New newsletter" : "New announcement"}
              </p>
              <Input placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              <Textarea
                placeholder="Body"
                rows={4}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button type="button" onClick={() => pushNotify(mainTab === "newsletters")}>
                Publish
              </Button>
            </CardContent>
          </Card>
          <ul className="space-y-2">
            {announcements.map((n) => (
              <li key={n.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <Badge variant="secondary" className="capitalize">
                    {n.type}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mainTab === "ptm" && (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s) => (
            <li key={s.id}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{s.teacherName}</p>
                      <p className="text-xs text-muted">
                        {s.date} · {s.time}
                      </p>
                    </div>
                    <Badge
                      variant={s.status === "open" ? "success" : s.status === "booked" ? "info" : "secondary"}
                      className="capitalize"
                    >
                      {s.status}
                    </Badge>
                  </div>
                  {s.parentName && (
                    <p className="text-xs text-muted">
                      {s.parentName} · {s.childName}
                    </p>
                  )}
                  {s.status === "open" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => bookOrOpen(s)}>
                      Mark booked
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-lg">
            <p className="text-sm font-bold">New message · {audience === "parent" ? "Parent" : "Staff"}</p>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Recipient name"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
              />
              <Textarea
                placeholder="Message"
                rows={4}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1" onClick={createMessage}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
