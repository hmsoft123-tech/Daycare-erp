"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useMemo } from "react";

interface Summary {
  id: string;
  name: string;
  className: string;
  rate: number;
  present: number;
  total: number;
}

export function AttendanceSummaryClient({ summaries }: { summaries: Summary[] }) {
  const branchId = useBranchFilter();

  const filtered = useMemo(() => {
    if (!branchId) return summaries;
    return summaries;
  }, [summaries, branchId]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {filtered.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-4">
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-gray-500">{s.className}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-brand-500">{s.rate}%</p>
            <p className="text-xs text-gray-400">{s.present}/{s.total} days</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.rate}%` }} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
