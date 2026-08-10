"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { formatSchoolDate, mockAssignments, type AssignmentItem } from "@/data/school";
import { fetchSchoolAssignments } from "@/lib/school-api";

const statuses = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" },
] as const;

const statusStyle = {
  open: "bg-brand-50 text-brand-700",
  submitted: "bg-soft-blue text-[#4C8BF5]",
  graded: "bg-soft-green text-[#0E9F6E]",
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<AssignmentItem[]>(mockAssignments);
  const [childId, setChildId] = useState("all");
  const [status, setStatus] = useState<(typeof statuses)[number]["id"]>("all");

  useEffect(() => {
    fetchSchoolAssignments().then(setItems);
  }, []);

  const rows = useMemo(
    () =>
      items.filter(
        (a) =>
          (childId === "all" || a.childId === childId) &&
          (status === "all" || a.status === status)
      ),
    [items, childId, status]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Assignments"
        subtitle="Projects and graded work from school"
      />
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
        {rows.map((a) => (
          <li key={a.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                  {a.subject}
                </p>
                <p className="mt-0.5 text-sm font-bold text-heading">{a.title}</p>
                <p className="text-xs text-muted">{a.childName}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                  statusStyle[a.status]
                )}
              >
                {a.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-heading/85">{a.brief}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
              <span>
                Due {formatSchoolDate(a.dueOn)} · Assigned {formatSchoolDate(a.assignedOn)}
              </span>
              {a.marks && (
                <span className="font-bold text-[#0E9F6E]">Result: {a.marks}</span>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted md:col-span-2">
            No assignments for these filters.
          </li>
        )}
      </ul>
    </div>
  );
}
