"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ShieldAlert } from "lucide-react";
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
import { useUIStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { AdminPlannerEntry, PlannerCategory } from "@/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<PlannerCategory, string> = {
  evacuation_drill: "Evacuation drill",
  fire_drill: "Fire drill",
  admin_task: "Admin task",
  other: "Other",
};

export function AnnualAdminPlannerCard() {
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";
  const [entries, setEntries] = useState<AdminPlannerEntry[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<PlannerCategory>("admin_task");

  const load = () => {
    void getPlannerEntries({ scope: "annual" }).then(setEntries);
  };

  useEffect(load, []);

  const addEntry = async () => {
    if (!title.trim() || !date) return;
    await createPlannerEntry({
      scope: "annual",
      title: title.trim(),
      date,
      category,
      createdBy: "Head Office",
    });
    setTitle("");
    setDate("");
    toast.success("Added to annual planner");
    load();
  };

  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <div className="mb-2 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-semibold text-heading">Annual Admin Planner</h3>
      </div>
      <p className="text-[11px] text-muted">Head Office master schedule · includes evacuation &amp; fire drills</p>

      <ul className="mt-3 space-y-1.5">
        {entries.length === 0 && <li className="text-xs text-muted">No annual entries yet.</li>}
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-xs"
          >
            <span className="flex items-center gap-1.5 font-medium text-heading">
              {(e.category === "evacuation_drill" || e.category === "fire_drill") && (
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              )}
              {e.title}
            </span>
            <span className="shrink-0 text-muted">{formatDate(e.date)}</span>
          </li>
        ))}
      </ul>

      {isHeadOffice && (
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
            Add to annual planner
          </Button>
        </div>
      )}
    </div>
  );
}
