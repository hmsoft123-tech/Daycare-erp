"use client";

import { useEffect, useState } from "react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { fetchParentOps } from "@/lib/parent-ops-api";
import { cn } from "@kinder-pilot/ui";

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
};

export default function ParentVirtualPage() {
  const [rows, setRows] = useState<Session[]>([]);

  useEffect(() => {
    fetchParentOps<Session>("virtual", []).then(setRows);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Virtual classroom"
        subtitle="Live & recorded sessions via Meet / Zoom / Teams"
      />
      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((r) => (
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
                href={r.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white"
              >
                Join session
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
