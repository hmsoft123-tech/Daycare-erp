"use client";

import { useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branches } from "@/data/branches";
import { maintenanceRecords, MAINTENANCE_CATEGORIES, type MaintenanceRecord } from "@/data/maintenance";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export function MaintenanceBoard() {
  const [rows] = useState<MaintenanceRecord[]>(maintenanceRecords);
  const [category, setCategory] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (!query) return true;
      return (
        r.vendor.toLowerCase().includes(query) ||
        r.issue.toLowerCase().includes(query) ||
        r.workPerformed.toLowerCase().includes(query)
      );
    });
  }, [rows, category, branchId, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor, issue, work…"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full lg:w-[220px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={() => toast.message("Add maintenance visit — demo shell")}>
          <Wrench className="h-4 w-4" />
          Log visit
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-bg text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Issue / work</th>
              <th className="px-4 py-3 text-left">Next service</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const branch = branches.find((b) => b.id === r.branchId)?.name ?? r.branchId;
              const cat = MAINTENANCE_CATEGORIES.find((c) => c.id === r.category)?.label ?? r.category;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-bg">
                  <td className="px-4 py-3 text-heading">{formatDate(r.visitDate)}</td>
                  <td className="px-4 py-3 text-muted">{branch.replace(" Campus", "")}</td>
                  <td className="px-4 py-3 text-heading">{cat}</td>
                  <td className="px-4 py-3 text-muted">{r.vendor}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-heading">{r.issue}</p>
                    <p className="line-clamp-1 text-xs text-muted">{r.workPerformed}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.nextServiceDate ? formatDate(r.nextServiceDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={r.status === "completed" ? "success" : r.status === "scheduled" ? "warning" : "info"}
                      className="capitalize"
                    >
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className={cn("px-4 py-10 text-center text-sm text-muted")}>No maintenance records match filters.</p>
        )}
      </div>
    </div>
  );
}
