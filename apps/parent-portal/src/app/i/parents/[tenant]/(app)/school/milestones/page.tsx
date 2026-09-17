"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { fetchParentOps } from "@/lib/parent-ops-api";
import { mockChildren } from "@/data/mock";

type MilestoneCategory = "motor" | "sensory" | "growth";

type MilestoneRecord = {
  id: string;
  studentId: string;
  category: MilestoneCategory;
  title: string;
  achievedDate?: string;
  targetAgeRange?: string;
};

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  motor: "Motor skills",
  sensory: "Sensory milestones",
  growth: "Physical growth",
};

export default function MilestonesPage() {
  const [childId, setChildId] = useState(mockChildren[0]?.id ?? "s1");
  const [records, setRecords] = useState<MilestoneRecord[]>([]);

  useEffect(() => {
    if (!childId || childId === "all") return;
    fetchParentOps<MilestoneRecord>("milestones", []).then((items) =>
      setRecords(items.filter((m) => m.studentId === childId))
    );
  }, [childId]);

  const grouped = useMemo(() => {
    const byCategory: Record<MilestoneCategory, MilestoneRecord[]> = {
      motor: [],
      sensory: [],
      growth: [],
    };
    for (const r of records) byCategory[r.category].push(r);
    return byCategory;
  }, [records]);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Baby milestones"
        subtitle="Motor, sensory & growth milestones tracked by your child's teacher"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />

      {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => (
        <section key={cat}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {CATEGORY_LABELS[cat]}
          </p>
          <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {grouped[cat].length === 0 && (
              <li className="rounded-2xl bg-surface p-4 text-sm text-muted shadow-card md:col-span-2">
                No entries yet.
              </li>
            )}
            {grouped[cat].map((m) => (
              <li
                key={m.id}
                className={cn(
                  "flex items-center justify-between rounded-2xl bg-surface p-4 shadow-card",
                  !m.achievedDate && "opacity-70"
                )}
              >
                <p className="text-sm font-semibold text-heading">{m.title}</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    m.achievedDate ? "bg-soft-green text-[#0E9F6E]" : "bg-bg text-muted"
                  )}
                >
                  {m.achievedDate ?? m.targetAgeRange ?? "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
