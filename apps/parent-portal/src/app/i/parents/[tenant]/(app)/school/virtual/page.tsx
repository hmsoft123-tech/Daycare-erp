"use client";

import { useEffect, useMemo, useState } from "react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { fetchParentOps } from "@/lib/parent-ops-api";
import { cn } from "@kinder-pilot/ui";
import { safeExternalUrl } from "@kinder-pilot/api-client/security";

type Session = {
  id: string;
  title: string;
  className: string;
  teacherName: string;
  provider: string;
  joinUrl: string;
  startsAt: string;
  durationMin: number;
  status: string;
  sessionCategory: "live" | "recorded";
  recordingUrl?: string;
  topic?: string;
};

export default function ParentVirtualPage() {
  const [rows, setRows] = useState<Session[]>([]);

  useEffect(() => {
    fetchParentOps<Session>("virtual", []).then(setRows);
  }, []);

  const live = rows.filter((r) => r.sessionCategory !== "recorded");
  const recorded = rows.filter((r) => r.sessionCategory === "recorded");
  const recordedByTopic = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const r of recorded) {
      const key = r.topic ?? "General";
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return map;
  }, [recorded]);

  return (
    <div className="space-y-6 md:space-y-8">
      <SchoolPageHeader
        title="Virtual classroom"
        subtitle="Live sessions & topic-wise recorded lessons via Meet / Zoom / Teams"
      />

      <section>
        <h2 className="mb-3 text-sm font-bold text-heading">Live classes</h2>
        <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {live.map((r) => (
            <li key={r.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{r.title}</p>
                  <p className="text-xs text-muted">
                    {r.className} · {r.teacherName} · {r.provider.toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(r.startsAt).toLocaleString()} · {r.durationMin} min
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                    r.status === "live"
                      ? "bg-soft-green text-[#0E9F6E]"
                      : r.status === "upcoming"
                        ? "bg-soft-blue text-[#4C8BF5]"
                        : "bg-bg text-muted"
                  )}
                >
                  {r.status}
                </span>
              </div>
              {r.status !== "ended" && (
                <a
                  href={safeExternalUrl(r.joinUrl) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white"
                >
                  Join session
                </a>
              )}
            </li>
          ))}
          {live.length === 0 && (
            <p className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-muted md:col-span-2">
              No live sessions scheduled.
            </p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-heading">Topic-wise recorded lessons</h2>
        {recordedByTopic.size === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-muted">
            No recorded lessons yet.
          </p>
        )}
        <div className="space-y-4">
          {Array.from(recordedByTopic.entries()).map(([topic, items]) => (
            <div key={topic}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{topic}</p>
              <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                {items.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-surface p-4 shadow-card">
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.className} · {r.teacherName}
                    </p>
                    <a
                      href={safeExternalUrl(r.recordingUrl) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white"
                    >
                      Watch recording
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
