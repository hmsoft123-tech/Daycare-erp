"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/billing/StatusPill";
import { RollCallButton } from "./RollCallButton";
import { getInitials } from "@/lib/utils";
import type { Student, AttendanceRecord, AttendanceStatus } from "@/types";

interface AttendanceGridProps {
  students: Student[];
  initialRecords: AttendanceRecord[];
}

export function AttendanceGrid({ students, initialRecords }: AttendanceGridProps) {
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

  const presentCount = Array.from(records.values()).filter((s) => s === "present" || s === "late").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {presentCount} of {students.length} marked present
        </p>
        <RollCallButton
          onMarkAllPresent={() => {
            setRecords((prev) => {
              const next = new Map(prev);
              students.forEach((s) => next.set(s.id, "present"));
              return next;
            });
          }}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => {
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
                  <p className="text-xs text-gray-500">{student.className}</p>
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
    </div>
  );
}
