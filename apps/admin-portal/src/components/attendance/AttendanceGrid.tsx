"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/billing/StatusPill";
import { RollCallButton } from "./RollCallButton";
import { getInitials } from "@/lib/utils";
import type { Student, AttendanceRecord, AttendanceStatus, ClassRoom } from "@/types";

interface AttendanceGridProps {
  students: Student[];
  classes: ClassRoom[];
  initialRecords: AttendanceRecord[];
  initialClassId?: string;
}

export function AttendanceGrid({
  students,
  classes,
  initialRecords,
  initialClassId,
}: AttendanceGridProps) {
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? "");

  const classStudents = useMemo(() => {
    if (!classId) return students;
    const filtered = students.filter((s) => s.classId === classId);
    return filtered.length > 0 ? filtered : students.filter((s) => s.status === "active").slice(0, 6);
  }, [students, classId]);

  const selectedClass = classes.find((c) => c.id === classId);

  const [records, setRecords] = useState<Map<string, AttendanceStatus>>(() => {
    const map = new Map<string, AttendanceStatus>();
    initialRecords.forEach((r) => map.set(r.studentId, r.status));
    students.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, "absent");
    });
    return map;
  });

  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => new Map(prev).set(studentId, status));
  };

  const presentCount = classStudents.filter((s) => {
    const st = records.get(s.id);
    return st === "present" || st === "late";
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClass && (
            <p className="text-xs text-muted">Marking attendance for {selectedClass.name} — Today</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="text-sm text-muted">
            {presentCount} of {classStudents.length} marked present
          </p>
          <RollCallButton
            onMarkAllPresent={() => {
              setRecords((prev) => {
                const next = new Map(prev);
                classStudents.forEach((s) => next.set(s.id, "present"));
                return next;
              });
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classStudents.map((student) => {
          const status = records.get(student.id) ?? "absent";
          return (
            <Card key={student.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  {student.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {getInitials(`${student.firstName} ${student.lastName}`)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-muted">{student.className}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill status={status} />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={status === "present" ? "success" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleStatus(student.id, "present")}
                    >
                      P
                    </Button>
                    <Button
                      size="sm"
                      variant={status === "late" ? "warm" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleStatus(student.id, "late")}
                    >
                      L
                    </Button>
                    <Button
                      size="sm"
                      variant={status === "absent" ? "destructive" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleStatus(student.id, "absent")}
                    >
                      A
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {classStudents.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">No students in this class.</p>
      )}
    </div>
  );
}
