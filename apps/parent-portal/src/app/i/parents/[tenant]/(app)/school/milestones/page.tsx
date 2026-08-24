"use client";

import { useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";

const MILESTONES = [
  "Tummy Rolls",
  "Neck Holding",
  "Teething",
  "Solids",
  "Sitting With support",
  "Sitting Without support",
  "Crawling",
  "First Steps",
] as const;

const seed: Record<string, Partial<Record<(typeof MILESTONES)[number], string>>> = {
  s1: {
    "Tummy Rolls": "2021-05-01",
    "Neck Holding": "2021-06-15",
    Teething: "2021-09-10",
    Solids: "2021-10-01",
    "Sitting With support": "2021-11-20",
    "Sitting Without support": "2022-01-08",
    Crawling: "2022-03-12",
    "First Steps": "2022-06-30",
  },
  s2: {
    "Tummy Rolls": "2022-03-01",
    "Neck Holding": "2022-04-20",
    Teething: "2022-08-01",
    Solids: "2022-09-15",
    "Sitting With support": "2022-11-01",
  },
};

export default function MilestonesPage() {
  const [childId, setChildId] = useState("s1");
  const rows = useMemo(() => seed[childId] ?? {}, [childId]);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Baby milestones"
        subtitle="1 month to ~1.4 years — tummy time through first steps"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />
      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {MILESTONES.map((m) => {
          const achieved = rows[m];
          return (
            <li
              key={m}
              className={cn(
                "flex items-center justify-between rounded-2xl bg-surface p-4 shadow-card",
                !achieved && "opacity-70"
              )}
            >
              <p className="text-sm font-semibold text-heading">{m}</p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  achieved ? "bg-soft-green text-[#0E9F6E]" : "bg-bg text-muted"
                )}
              >
                {achieved ?? "Pending"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
