"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { abcIncidents, type AbcIncident } from "@/data/extended-ops";
import { students } from "@/data/students";
import { postParentOpsAction } from "@/lib/parent-ops-client";

export function IncidentsHub() {
  const [rows, setRows] = useState(abcIncidents);
  const [studentId, setStudentId] = useState("s1");
  const [activityArea, setActivityArea] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [behavior, setBehavior] = useState("");
  const [consequence, setConsequence] = useState("");
  const [firstAid, setFirstAid] = useState("");

  const submit = async (notify: boolean) => {
    if (!behavior.trim()) {
      toast.error("Student and behaviour required");
      return;
    }
    const result = await postParentOpsAction<AbcIncident>({
      action: "createIncident",
      studentId,
      activityArea,
      antecedent,
      behavior: behavior.trim(),
      consequence,
      firstAid,
      notifyParent: notify,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setRows((prev) => [result.item, ...prev]);
    toast.success(
      notify
        ? "Incident saved — parent School → Incidents & Alerts updated"
        : "Incident submitted (not yet shown to parent)"
    );
    setBehavior("");
    setAntecedent("");
    setConsequence("");
    setFirstAid("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">ABC Incident Report</p>
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((s) => s.status === "active")
                  .slice(0, 12)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Activity area</Label>
            <Input value={activityArea} onChange={(e) => setActivityArea(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Antecedent (trigger)</Label>
            <Textarea rows={2} value={antecedent} onChange={(e) => setAntecedent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Behavior</Label>
            <Textarea rows={2} value={behavior} onChange={(e) => setBehavior(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Consequence / response</Label>
            <Textarea rows={2} value={consequence} onChange={(e) => setConsequence(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>First aid (if any)</Label>
            <Input value={firstAid} onChange={(e) => setFirstAid(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => submit(false)}>
              Submit
            </Button>
            <Button type="button" onClick={() => submit(true)}>
              Submit & notify parent
            </Button>
          </div>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[#F1F3F5] bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {r.studentName} · {r.date} {r.time}
              </p>
              <Badge variant={r.notifiedParent ? "success" : "secondary"} className="capitalize">
                {r.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted">Area: {r.activityArea}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">A:</span> {r.antecedent}
            </p>
            <p className="text-sm">
              <span className="font-semibold">B:</span> {r.behavior}
            </p>
            <p className="text-sm">
              <span className="font-semibold">C:</span> {r.consequence}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
