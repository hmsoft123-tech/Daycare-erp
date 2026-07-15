"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatCurrency } from "@/lib/utils";
import { branches } from "@/data/branches";
import { useMemo } from "react";

interface BranchRevenueRow {
  branchId: string;
  month: string;
  revenue: number;
}

export function ReportsRevenueClient({ branchRevenue }: { branchRevenue: BranchRevenueRow[] }) {
  const branchId = useBranchFilter();

  const filtered = useMemo(
    () => (branchId ? branchRevenue.filter((r) => r.branchId === branchId) : branchRevenue),
    [branchRevenue, branchId]
  );

  const byBranch = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      map.set(r.branchId, (map.get(r.branchId) ?? 0) + r.revenue);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Card>
      <CardHeader><CardTitle>Branch Revenue Breakdown</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {byBranch.map(([id, total]) => {
            const branch = branches.find((b) => b.id === id);
            return (
              <div key={id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="font-medium">{branch?.name ?? id}</span>
                <span className="font-semibold text-brand-500">{formatCurrency(total)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
