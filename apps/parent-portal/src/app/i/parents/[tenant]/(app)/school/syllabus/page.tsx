"use client";

import { useEffect, useMemo, useState } from "react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { formatSchoolDate, mockSyllabus, type SyllabusTopic } from "@/data/school";
import { fetchSchoolSyllabus } from "@/lib/school-api";

export default function SyllabusPage() {
  const [items, setItems] = useState<SyllabusTopic[]>(mockSyllabus);
  const [childId, setChildId] = useState("all");

  useEffect(() => {
    fetchSchoolSyllabus().then(setItems);
  }, []);

  const rows = useMemo(
    () => items.filter((s) => childId === "all" || s.childId === childId),
    [items, childId]
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Syllabus"
        subtitle="Weekly themes published by teachers"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />

      <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((s) => (
          <li key={s.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                  {s.subject}
                </p>
                <p className="mt-0.5 text-sm font-bold text-heading">{s.unit}</p>
                <p className="text-xs text-muted">
                  {s.childName} · Week of {formatSchoolDate(s.weekOf)}
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {s.topics.map((t) => (
                <li
                  key={t}
                  className="rounded-lg bg-bg px-2.5 py-1.5 text-xs font-medium text-heading"
                >
                  {t}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted md:col-span-2">
            No syllabus units for this child yet.
          </li>
        )}
      </ul>
    </div>
  );
}
