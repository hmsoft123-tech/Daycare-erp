"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GaugeChart } from "./GaugeChart";
import { branches } from "@/data/branches";
import type { BranchScorecard } from "@/types";

interface BranchScorecardProps {
  scorecards: BranchScorecard[];
}

export function BranchScorecard({ scorecards }: BranchScorecardProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {scorecards.map((sc) => {
        const branch = branches.find((b) => b.id === sc.branchId);
        return (
          <Card key={sc.branchId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{branch?.name ?? sc.branchId}</CardTitle>
              <p className="text-2xl font-bold text-brand-500">Grade {sc.overallGrade}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <GaugeChart label="Academic" value={sc.academic} />
              <GaugeChart label="Hygiene" value={sc.hygiene} />
              <GaugeChart label="Finance" value={sc.finance} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
