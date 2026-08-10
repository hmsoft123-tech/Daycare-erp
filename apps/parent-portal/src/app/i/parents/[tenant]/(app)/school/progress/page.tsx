"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { formatSchoolDate, mockProgressReports, type ProgressReport } from "@/data/school";
import { fetchSchoolProgress } from "@/lib/school-api";

const levelStyle = {
  emerging: "bg-soft-yellow text-[#B76E00]",
  developing: "bg-soft-blue text-[#4C8BF5]",
  secure: "bg-soft-green text-[#0E9F6E]",
};

export default function ProgressPage() {
  const [items, setItems] = useState<ProgressReport[]>(mockProgressReports);
  const [childId, setChildId] = useState("all");

  useEffect(() => {
    fetchSchoolProgress().then(setItems);
  }, []);

  const reports = useMemo(
    () => items.filter((r) => childId === "all" || r.childId === childId),
    [items, childId]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Progress report"
        subtitle="Term summaries issued by teachers"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />

      <div className="space-y-4">
        {reports.map((r) => (
          <article key={r.id} className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-heading">{r.childName}</p>
                <p className="text-xs text-muted">
                  {r.className} · {r.term}
                </p>
              </div>
              <p className="text-[11px] font-semibold text-muted">
                Issued {formatSchoolDate(r.issuedOn)}
              </p>
            </div>
            <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
              {r.overall}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {r.areas.map((a) => (
                <li key={a.label} className="rounded-xl border border-black/[0.06] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-heading">{a.label}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                        levelStyle[a.level]
                      )}
                    >
                      {a.level}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{a.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-heading/85">
              <span className="font-semibold">Teacher note:</span> {r.teacherComment}
            </p>
          </article>
        ))}
        {reports.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted">
            No progress reports yet for this child.
          </p>
        )}
      </div>
    </div>
  );
}
