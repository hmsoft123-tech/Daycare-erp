"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TherapyLogForm } from "@/components/hr/TherapyLogForm";
import { formatDate } from "@/lib/utils";
import type { TherapySession } from "@/types";

type Props = {
  studentId: string;
  studentName: string;
  sessions: TherapySession[];
};

export function StudentTherapyPanel({ studentId, studentName, sessions: initial }: Props) {
  const [sessions, setSessions] = useState(initial);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TherapyLogForm
        studentId={studentId}
        studentName={studentName}
        onSaved={(session) => setSessions((prev) => [session, ...prev])}
      />
      <Card>
        <CardHeader>
          <CardTitle>Therapy sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">No therapy sessions logged for this student yet.</p>
          ) : (
            <ul className="space-y-4">
              {sessions.map((s) => (
                <li key={s.id} className="rounded-xl border border-[#F1F3F5] p-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-heading">{s.types.join(", ")}</span>
                    <span className="text-muted">{formatDate(s.date)}</span>
                  </div>
                  <p className="mt-1 text-muted">
                    {s.therapistName} · {s.duration} min · Compliance {s.complianceScore}/10
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-heading">
                    <p>
                      <span className="font-semibold text-muted">S: </span>
                      {s.subjective}
                    </p>
                    <p>
                      <span className="font-semibold text-muted">O: </span>
                      {s.objective}
                    </p>
                    <p>
                      <span className="font-semibold text-muted">A: </span>
                      {s.assessment}
                    </p>
                    <p>
                      <span className="font-semibold text-muted">P: </span>
                      {s.plan}
                    </p>
                  </div>
                  {s.goalsAchieved.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Goals: {s.goalsAchieved.join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
