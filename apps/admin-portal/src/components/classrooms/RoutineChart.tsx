"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { ClassroomActivity, Student } from "@/types";

const ROUTINE_TYPE_LABELS: Record<string, string> = {
  checkin: "Time-in",
  checkout: "Time-out",
  meal: "Meal",
  nap: "Nap",
  potty: "Diaper change",
  clothing_change: "Clothing change",
  activity: "Activity",
  learning: "Learning",
  note: "Note",
  photo: "Photo",
};

type Props = {
  students: Student[];
  activities: ClassroomActivity[];
};

/** Per-child daily routine chart — time-in/out, meals, naps, diaper & clothing changes, activities */
export function RoutineChart({ students, activities }: Props) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");

  const datesForStudent = useMemo(() => {
    const dates = new Set(
      activities.filter((a) => a.studentId === studentId).map((a) => a.createdAt.slice(0, 10))
    );
    return Array.from(dates).sort((a, b) => (a < b ? 1 : -1));
  }, [activities, studentId]);

  const [date, setDate] = useState(() => datesForStudent[0] ?? new Date().toISOString().slice(0, 10));
  const activeDate = datesForStudent.includes(date) ? date : datesForStudent[0];

  const rows = useMemo(() => {
    return activities
      .filter((a) => a.studentId === studentId && a.createdAt.slice(0, 10) === activeDate)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [activities, studentId, activeDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily routine chart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={studentId}
            onValueChange={(v) => {
              setStudentId(v);
              setDate("");
            }}
          >
            <SelectTrigger className="w-48"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeDate ?? ""} onValueChange={setDate}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent>
              {datesForStudent.map((d) => (
                <SelectItem key={d} value={d}>
                  {formatDate(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted">No routine entries logged for this day.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-[11px] uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Routine</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-3 py-2.5 text-muted">
                      {a.time}
                      {a.timeOut ? ` – ${a.timeOut}` : ""}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="info" className="capitalize">
                        {ROUTINE_TYPE_LABELS[a.type] ?? a.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-heading">
                      <span className="font-medium">{a.title}</span>
                      {a.body && <span className="text-muted"> — {a.body}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
