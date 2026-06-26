"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { branches } from "@/data/branches";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const branchPositions: Record<string, { top: string; left: string }> = {
  "branch-nn": { top: "25%", left: "55%" },
  "branch-clifton": { top: "70%", left: "45%" },
  "branch-dha": { top: "75%", left: "60%" },
  "branch-gulshan": { top: "35%", left: "70%" },
};

export function BranchMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Karachi Branch Network</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto aspect-[4/3] max-w-lg rounded-xl bg-brand-50">
          <div className="absolute inset-4 rounded-lg border-2 border-dashed border-brand-200" />
          {branches.map((branch) => {
            const pos = branchPositions[branch.id];
            return (
              <div
                key={branch.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className="group relative">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full shadow-md",
                      branch.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  >
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-900 px-3 py-2 text-xs text-white group-hover:block">
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-white/70">{branch.headCount} students</p>
                    <Badge variant={branch.status === "healthy" ? "success" : "warning"} className="mt-1">
                      {branch.status}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {branches.map((b) => (
            <li key={b.id} className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-brand-500" />
              <span>{b.name}</span>
              <span className="text-gray-400">— {b.city}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
