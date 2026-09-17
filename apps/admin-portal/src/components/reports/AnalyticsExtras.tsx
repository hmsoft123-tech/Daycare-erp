"use client";

import { Card, CardContent } from "@/components/ui/card";
import { trainingAssignments, trainingCertificatesIssued } from "@/data/training-assignments";
import { parentSchoolAttendance } from "@/data/parent-school";
import { cn } from "@/lib/utils";

const branchLabels: Record<string, string> = {
  "branch-nn": "Nazimabad",
  "branch-clifton": "Johar",
  "branch-dha": "PECHS",
  "branch-gulshan": "Gulshan",
  "branch-north": "North",
};

type Props = {
  /** Which blocks to render — default all for backward compat */
  show?: "all" | "attendance" | "people";
};

export function AnalyticsExtras({ show = "all" }: Props) {
  const byBranch = Object.entries(
    trainingAssignments.reduce<Record<string, { total: number; done: number }>>((acc, a) => {
      const cur = acc[a.branchId] ?? { total: 0, done: 0 };
      cur.total += 1;
      if (a.status === "completed") cur.done += 1;
      acc[a.branchId] = cur;
      return acc;
    }, {})
  );

  const attendanceStats = (() => {
    const present = parentSchoolAttendance.filter((r) => r.status === "present").length;
    const late = parentSchoolAttendance.filter((r) => r.status === "late").length;
    const absent = parentSchoolAttendance.filter((r) => r.status === "absent").length;
    const leave = parentSchoolAttendance.filter((r) => r.status === "leave").length;
    const total = parentSchoolAttendance.length || 1;
    return {
      present,
      late,
      absent,
      leave,
      pct: Math.round(((present + late) / total) * 100),
    };
  })();

  const parentEngagement = [
    { label: "School module views (demo)", value: 428 },
    { label: "Learn videos started", value: 186 },
    { label: "Notices opened", value: 312 },
    { label: "Fee challans downloaded", value: 94 },
  ];

  const showAttendance = show === "all" || show === "attendance";
  const showPeople = show === "all" || show === "people";

  return (
    <div className="space-y-6">
      {showPeople && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-heading">Training analytics</h3>
            <p className="text-xs text-muted">
              Assignment completion by branch · {trainingCertificatesIssued.length} certificates issued
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {byBranch.map(([id, s]) => {
              const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <Card key={id}>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-semibold">{branchLabels[id] ?? id}</p>
                    <p className="font-heading text-2xl font-bold">{pct}%</p>
                    <p className="text-[11px] text-muted">
                      {s.done}/{s.total} tracks complete
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-bg">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {showAttendance && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-heading">Attendance analytics</h3>
            <p className="text-xs text-muted">From Academics / parent-synced roll call records</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["Present rate", `${attendanceStats.pct}%`, "text-[#0E9F6E]"],
                ["Present", String(attendanceStats.present), "text-[#0E9F6E]"],
                ["Late", String(attendanceStats.late), "text-[#B76E00]"],
                ["Absent", String(attendanceStats.absent), "text-danger"],
                ["Leave", String(attendanceStats.leave), "text-[#4C8BF5]"],
              ] as const
            ).map(([label, value, color]) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold text-muted">{label}</p>
                  <p className={cn("mt-1 font-heading text-2xl font-bold", color)}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showPeople && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-heading">Parent portal engagement</h3>
            <p className="text-xs text-muted">Demo metrics — replace with real telemetry later</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {parentEngagement.map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold text-muted">{m.label}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-heading">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
