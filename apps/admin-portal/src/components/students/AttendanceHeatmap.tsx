"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";
import { format, parseISO } from "date-fns";

interface AttendanceHeatmapProps {
  records: AttendanceRecord[];
}

const statusColors: Record<AttendanceRecord["status"], string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  late: "bg-amber-500",
};

export function AttendanceHeatmap({ records }: AttendanceHeatmapProps) {
  const days = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    return sorted;
  }, [records]);

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === "present").length;
    const total = records.length || 1;
    return Math.round((present / total) * 100);
  }, [records]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance History</span>
          <span className="text-sm font-normal text-gray-500">{stats}% present rate</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15">
          {days.map((day) => (
            <div
              key={day.date}
              title={`${format(parseISO(day.date), "dd MMM")}: ${day.status}`}
              className={cn("aspect-square rounded-sm", statusColors[day.status])}
            />
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-emerald-500" /> Present</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-amber-500" /> Late</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-500" /> Absent</span>
        </div>
      </CardContent>
    </Card>
  );
}
