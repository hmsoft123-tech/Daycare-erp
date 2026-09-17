"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMilestone, getMilestones } from "@/lib/mock-service";
import { formatDate } from "@/lib/utils";
import type { MilestoneCategory, MilestoneRecord, Student } from "@/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  motor: "Motor skills",
  sensory: "Sensory milestones",
  growth: "Physical growth",
};

type Props = {
  students: Student[];
  teacherName: string;
};

/** Teacher-entry UI for infant developmental milestones — motor, sensory, growth */
export function MilestoneEntryPanel({ students, teacherName }: Props) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [records, setRecords] = useState<MilestoneRecord[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MilestoneCategory>("motor");
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [achievedDate, setAchievedDate] = useState("");

  const load = (id: string) => {
    if (!id) return;
    void getMilestones(id).then(setRecords);
  };

  useEffect(() => load(studentId), [studentId]);

  const grouped = useMemo(() => {
    const byCategory: Record<MilestoneCategory, MilestoneRecord[]> = {
      motor: [],
      sensory: [],
      growth: [],
    };
    for (const r of records) byCategory[r.category].push(r);
    return byCategory;
  }, [records]);

  const addMilestone = async () => {
    if (!title.trim() || !studentId) return;
    await createMilestone({
      studentId,
      category,
      title: title.trim(),
      targetAgeRange: targetAgeRange.trim() || undefined,
      achievedDate: achievedDate || undefined,
      enteredBy: teacherName,
    });
    setTitle("");
    setTargetAgeRange("");
    setAchievedDate("");
    toast.success("Milestone recorded");
    load(studentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infant milestone chart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {CATEGORY_LABELS[cat]}
            </p>
            <ul className="mt-1.5 space-y-1">
              {grouped[cat].length === 0 && (
                <li className="text-xs text-muted">No entries yet.</li>
              )}
              {grouped[cat].map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-bg px-2.5 py-1.5 text-xs"
                >
                  <span className="font-medium text-heading">{m.title}</span>
                  <span className="text-muted">
                    {m.achievedDate ? formatDate(m.achievedDate) : m.targetAgeRange ?? "In progress"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-2 border-t border-border pt-3">
          <Input placeholder="Milestone title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as MilestoneCategory)}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Target age range"
              value={targetAgeRange}
              onChange={(e) => setTargetAgeRange(e.target.value)}
              className="flex-1"
            />
          </div>
          <Input
            type="date"
            value={achievedDate}
            onChange={(e) => setAchievedDate(e.target.value)}
            placeholder="Achieved date (leave blank if in progress)"
          />
          <Button type="button" size="sm" onClick={() => void addMilestone()}>
            Add milestone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
