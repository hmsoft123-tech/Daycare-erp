"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeFileSlot } from "@/components/hr/employee-file/EmployeeFileSlot";
import { EMPLOYEE_FILE_INTRO, EMPLOYEE_FILE_SLOTS } from "@/data/employee-file";
import {
  canEditSlot,
  entryMap,
  isProbationComplete,
  mergeEmployeeFile,
  missingRequiredHire,
  phaseLabel,
} from "@/lib/employee-file";
import { updateStaffEmployeeFile, markStaffProbationComplete } from "@/lib/mock-service";
import type { EmployeeFileEntry, EmployeeFileSlotKey, Staff } from "@/types";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Props = {
  member: Staff;
};

const PHASE_ORDER = ["hire", "post_probation", "ongoing", "exit"] as const;

export function EmployeeFilePanel({ member: initial }: Props) {
  const [member, setMember] = useState(initial);
  const [file, setFile] = useState<EmployeeFileEntry[]>(
    initial.employeeFile?.length
      ? initial.employeeFile
      : EMPLOYEE_FILE_SLOTS.map((s) => ({ key: s.key, received: false }))
  );
  const [saving, setSaving] = useState(false);

  const map = useMemo(() => entryMap(file), [file]);
  const probationDone = isProbationComplete(member);
  const missingHire = missingRequiredHire(file, "admin");

  const setSlot = (key: EmployeeFileSlotKey, fileName: string) => {
    setFile((prev) =>
      mergeEmployeeFile(prev, {
        [key]: {
          received: true,
          fileName,
          receivedAt: new Date().toISOString().slice(0, 10),
        },
      })
    );
  };

  const save = async () => {
    setSaving(true);
    const updated = await updateStaffEmployeeFile(member.id, file);
    setSaving(false);
    if (!updated) {
      toast.error("Could not save employee file");
      return;
    }
    setMember(updated);
    toast.success("Employee file updated");
  };

  const completeProbation = async () => {
    const updated = await markStaffProbationComplete(member.id);
    if (!updated) return;
    setMember(updated);
    toast.success("Probation marked complete — post-probation fields unlocked");
  };

  const receivedCount = file.filter((e) => e.received).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4">
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-heading">
          <FolderOpen className="h-4 w-4 text-brand-500" />
          Employee file (SDLC HR Policy)
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted">{EMPLOYEE_FILE_INTRO}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="info">
            {receivedCount}/{EMPLOYEE_FILE_SLOTS.length} on file
          </Badge>
          {missingHire.length > 0 && (
            <Badge variant="danger">{missingHire.length} compulsory hire item(s) missing</Badge>
          )}
          {member.probationEndDate && (
            <Badge variant={probationDone ? "success" : "warning"}>
              Probation {probationDone ? "complete" : `until ${formatDate(member.probationEndDate)}`}
            </Badge>
          )}
        </div>
        {!probationDone && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-xs text-amber-800">
              After probation, admin can edit evaluation / promotion / salary revision fields.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={completeProbation}>
              Mark probation complete
            </Button>
          </div>
        )}
      </div>

      {PHASE_ORDER.map((phase) => {
        const slots = EMPLOYEE_FILE_SLOTS.filter((s) => s.phase === phase);
        return (
          <div key={phase} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {phaseLabel(phase)}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => {
                const editable = canEditSlot(slot, member);
                const entry = map[slot.key];
                return (
                  <EmployeeFileSlot
                    key={slot.key}
                    slot={slot}
                    value={entry.fileName}
                    received={entry.received}
                    disabled={!editable}
                    showPhase={false}
                    onFile={(name) => setSlot(slot.key, name)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save employee file"}
        </Button>
      </div>
    </div>
  );
}
