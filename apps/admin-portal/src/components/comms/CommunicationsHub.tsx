"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
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

export function CommunicationsHub() {
  const [tab, setTab] = useState<"inbox" | "ptm" | "notify">("inbox");
  const [threads, setThreads] = useState(messageThreads);
  const [active, setActive] = useState<MessageThread | null>(threads[0] ?? null);
  const [draft, setDraft] = useState("");
  const [slots, setSlots] = useState(ptmSlots);
  const [notes, setNotes] = useState(appNotifications);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const parentNotes = useMemo(
    () => notes.filter((n) => n.audience === "parent" || n.audience === "all"),
    [notes]
  );

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
    toast.success("Reply sent to parent portal");
  };

  const bookOrOpen = (slot: PtmSlot) => {
    if (slot.status === "open") {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                status: "booked",
                parentName: "Walk-in parent",
                childName: "TBD",
              }
            : s
        )
      );
      toast.success("Slot marked booked");
    }
  };

  const pushNotify = () => {
    if (!noteTitle.trim() || !noteBody.trim()) return;
    setNotes((prev) => [
      {
        id: `n-${Date.now()}`,
        audience: "parent",
        title: noteTitle,
        body: noteBody,
        createdAt: new Date().toISOString(),
        type: "announcement",
      },
      ...prev,
    ]);
    setNoteTitle("");
    setNoteBody("");
    toast.success("Notification pushed to parents");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["inbox", "Parent inbox"],
            ["ptm", "PTM slots"],
            ["notify", "Push notifications"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              tab === id ? "bg-brand-500 text-white" : "bg-bg text-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActive(t)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left",
                    active?.id === t.id ? "border-brand-500 bg-brand-50" : "border-[#F1F3F5] bg-surface"
                  )}
                >
                  <p className="text-sm font-semibold">{t.withName}</p>
                  <p className="text-[11px] text-muted">{t.parentName}</p>
                  <p className="mt-1 truncate text-xs">{t.preview}</p>
                </button>
              </li>
            ))}
          </ul>
          <Card>
            <CardContent className="space-y-3 p-4">
              {active ? (
                <>
                  <p className="text-sm font-semibold">
                    {active.withName} · {active.parentName}
                    {active.childName ? ` · ${active.childName}` : ""}
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-bg p-3">
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
                      placeholder="Reply as staff…"
                    />
                    <Button type="button" onClick={sendReply}>
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Select a thread</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "ptm" && (
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

      {tab === "notify" && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Push to parents</p>
              <Input
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <Textarea
                placeholder="Body"
                rows={4}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button type="button" onClick={pushNotify}>
                Send notification
              </Button>
            </CardContent>
          </Card>
          <ul className="space-y-2">
            {parentNotes.map((n) => (
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
    </div>
  );
}
