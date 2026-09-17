"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlannerEntry, getPlannerEntries } from "@/lib/mock-service";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useUIStore } from "@/lib/store";
import { branches } from "@/data/branches";
import { formatDate } from "@/lib/utils";
import type { AdminPlannerEntry, PlannerCategory } from "@/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<PlannerCategory, string> = {
  evacuation_drill: "Evacuation drill",
  fire_drill: "Fire drill",
  admin_task: "Admin task",
  other: "Other",
};

export function BranchMonthlyPlannerCard() {
  const ownBranchId = useBranchFilter();
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";

  const [viewBranchId, setViewBranchId] = useState(ownBranchId ?? branches[0]?.id ?? "");
  const [entries, setEntries] = useState<AdminPlannerEntry[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<PlannerCategory>("admin_task");

  const activeBranchId = isHeadOffice ? viewBranchId : (ownBranchId ?? viewBranchId);
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const load = () => {
    if (!activeBranchId) return;
    void getPlannerEntries({ scope: "branch_monthly", branchId: activeBranchId }).then(setEntries);
  };

  useEffect(load, [activeBranchId]);

  const addEntry = async () => {
    if (!title.trim() || !date || !activeBranchId) return;
    await createPlannerEntry({
      scope: "branch_monthly",
      branchId: activeBranchId,
      title: title.trim(),
      date,
      category,
      createdBy: "Branch Admin",
    });
    setTitle("");
    setDate("");
    toast.success("Added to branch monthly planner");
    load();
  };

  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-heading">Branch-Wise Monthly Planner</h3>
        </div>
        {isHeadOffice && (
          <Select value={viewBranchId} onValueChange={setViewBranchId}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <p className="text-[11px] text-muted">
        {isHeadOffice ? `Viewing ${activeBranch?.name ?? "—"}` : "Your branch's operational schedule"}
      </p>

      <ul className="mt-3 space-y-1.5">
        {entries.length === 0 && <li className="text-xs text-muted">No entries this branch yet.</li>}
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-xs"
          >
            <span className="font-medium text-heading">{e.title}</span>
            <span className="shrink-0 text-muted">{formatDate(e.date)}</span>
          </li>
        ))}
      </ul>

      {!isHeadOffice && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <Input placeholder="Entry title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
            <Select value={category} onValueChange={(v) => setCategory(v as PlannerCategory)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={() => void addEntry()}>
            Add to this month
          </Button>
        </div>
      )}
    </div>
  );
}
