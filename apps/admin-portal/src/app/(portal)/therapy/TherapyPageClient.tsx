"use client";

import { useState } from "react";
import { TherapyLogForm } from "@/components/hr/TherapyLogForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Student } from "@/types";

export function TherapyPageClient({ students }: { students: Student[] }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  const selected = students.find((s) => s.id === selectedId);

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Student</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected && (
        <TherapyLogForm
          key={selected.id}
          studentId={selected.id}
          studentName={`${selected.firstName} ${selected.lastName}`}
        />
      )}
    </div>
  );
}
