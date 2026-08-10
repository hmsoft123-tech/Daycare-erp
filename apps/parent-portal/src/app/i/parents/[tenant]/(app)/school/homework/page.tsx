"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { formatSchoolDate, mockHomework, type HomeworkItem } from "@/data/school";
import { fetchSchoolHomework } from "@/lib/school-api";

const statuses = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "submitted", label: "Submitted" },
  { id: "checked", label: "Checked" },
] as const;

const statusStyle = {
  pending: "bg-soft-yellow text-[#B76E00]",
  submitted: "bg-soft-blue text-[#4C8BF5]",
  checked: "bg-soft-green text-[#0E9F6E]",
};

export default function HomeworkPage() {
  const [items, setItems] = useState<HomeworkItem[]>(mockHomework);
  const [childId, setChildId] = useState("all");
  const [status, setStatus] = useState<(typeof statuses)[number]["id"]>("all");

  useEffect(() => {
    fetchSchoolHomework().then(setItems);
  }, []);

  const rows = useMemo(
    () =>
      items.filter(
        (h) =>
          (childId === "all" || h.childId === childId) &&
          (status === "all" || h.status === status)
      ),
    [items, childId, status]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader title="Homework" subtitle="Published by teachers from the school" />
      <ChildFilterChips value={childId} onChange={setChildId} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              status === f.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((h) => (
          <li key={h.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                  {h.subject}
                </p>
                <p className="mt-0.5 text-sm font-bold text-heading">{h.title}</p>
                <p className="text-xs text-muted">{h.childName}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                  statusStyle[h.status]
                )}
              >
                {h.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-heading/85">{h.instructions}</p>
            <p className="mt-3 text-[11px] text-muted">
              Assigned {formatSchoolDate(h.assignedOn)} · Due {formatSchoolDate(h.dueOn)}
            </p>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted md:col-span-2">
            No homework for these filters.
          </li>
        )}
      </ul>
    </div>
  );
}
