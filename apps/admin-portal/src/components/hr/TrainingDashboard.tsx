"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingAssignment, TrainingCertificate, TrainingVideo } from "@/types";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  UserPlus,
  Users,
} from "lucide-react";

type Props = {
  videos: TrainingVideo[];
  assignments: TrainingAssignment[];
  certificates: TrainingCertificate[];
};

export function TrainingDashboard({ videos, assignments, certificates }: Props) {
  const staffMods = videos.filter((v) => v.audience === "staff" && v.active !== false);
  const onboardingMods = staffMods.filter((v) => v.requiredForOnboarding);
  const completed = assignments.filter((a) => a.status === "completed").length;
  const pending = assignments.filter((a) => a.status === "assigned" || a.status === "in_progress").length;
  const overdue = assignments.filter((a) => a.status === "overdue").length;
  const newHires = assignments.filter((a) => a.isNewHire).length;
  const assignedStaff = new Set(assignments.flatMap((a) => a.videoIds)).size;
  const completionPct = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;

  const kpis = [
    { label: "Training modules", value: staffMods.length, icon: BookOpen, hint: "Active staff catalog" },
    { label: "Onboarding modules", value: onboardingMods.length, icon: UserPlus, hint: "Required for new staff" },
    { label: "Completed tracks", value: completed, icon: CheckCircle2, hint: "Assignment tracks done" },
    { label: "Pending / in progress", value: pending, icon: Clock, hint: "Still open" },
    { label: "Overdue", value: overdue, icon: Clock, hint: "Past due date" },
    { label: "New-hire tracks", value: newHires, icon: Users, hint: "Onboarding assignments" },
    { label: "Modules in use", value: assignedStaff, icon: BookOpen, hint: "Assigned across staff" },
    { label: "Completion %", value: `${completionPct}%`, icon: Award, hint: "Tracks completed" },
    { label: "Certificates issued", value: certificates.length, icon: Award, hint: "After pass / complete" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-heading">Training dashboard</h2>
        <p className="text-xs text-muted">
          SDLC Training Hub — modules, onboarding, completion, and certificates
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted">{k.label}</p>
                  <p className="font-heading text-2xl font-bold text-heading">{k.value}</p>
                  <p className="text-[10px] text-muted">{k.hint}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-heading">New staff onboarding</p>
            <p className="text-xs text-muted">
              New staff → assigned → materials → quiz → complete → certificate → analytics
            </p>
            <ul className="space-y-2">
              {assignments
                .filter((a) => a.isNewHire)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#F1F3F5] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{a.staffName}</p>
                      <p className="text-[11px] text-muted">
                        {a.videoIds.length} modules · due {a.dueOn}
                      </p>
                    </div>
                    <Badge
                      variant={
                        a.status === "completed"
                          ? "success"
                          : a.status === "overdue"
                            ? "danger"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {a.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-heading">Recent certificates</p>
            <ul className="space-y-2">
              {certificates.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-[#F1F3F5] px-3 py-2"
                >
                  <p className="text-sm font-semibold">{c.moduleTitle}</p>
                  <p className="text-[11px] text-muted">
                    {c.staffName} · {c.issuedOn} · {c.certificateNo}
                  </p>
                </li>
              ))}
              {certificates.length === 0 && (
                <p className="text-xs text-muted">No certificates issued yet.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
