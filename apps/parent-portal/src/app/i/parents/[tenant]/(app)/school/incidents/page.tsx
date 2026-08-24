"use client";

import { useEffect, useState } from "react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { fetchParentOps } from "@/lib/parent-ops-api";

type Incident = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  activityArea: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  firstAid?: string;
  status: string;
};

export default function ParentIncidentsPage() {
  const [childId, setChildId] = useState("all");
  const [rows, setRows] = useState<Incident[]>([]);

  useEffect(() => {
    fetchParentOps<Incident>("incidents", []).then(setRows);
  }, []);

  const list =
    childId === "all" ? rows : rows.filter((r) => r.studentId === childId);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Incident reports"
        subtitle="ABC reports shared by school after parent notify"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="text-sm font-bold">
              {r.studentName} · {r.date} {r.time}
            </p>
            <p className="text-xs text-muted">{r.activityArea}</p>
            <p className="mt-2 text-xs">
              <span className="font-semibold">A:</span> {r.antecedent}
            </p>
            <p className="text-xs">
              <span className="font-semibold">B:</span> {r.behavior}
            </p>
            <p className="text-xs">
              <span className="font-semibold">C:</span> {r.consequence}
            </p>
            {r.firstAid && (
              <p className="mt-1 text-xs text-muted">First aid: {r.firstAid}</p>
            )}
          </li>
        ))}
        {list.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted">
            No shared incident reports.
          </li>
        )}
      </ul>
    </div>
  );
}
