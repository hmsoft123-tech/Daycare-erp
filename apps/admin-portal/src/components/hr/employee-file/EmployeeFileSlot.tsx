"use client";

import { FileUp, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeFileSlotDef } from "@/data/employee-file";

type Props = {
  slot: EmployeeFileSlotDef;
  value?: string;
  received?: boolean;
  onFile: (name: string) => void;
  error?: string;
  disabled?: boolean;
  showPhase?: boolean;
};

export function EmployeeFileSlot({
  slot,
  value,
  received,
  onFile,
  error,
  disabled,
  showPhase,
}: Props) {
  const compulsory = slot.requiredOnHire || slot.requiredPostProbation;

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed bg-[#F9FAFB] p-4",
        disabled ? "border-[#E9ECEF] opacity-60" : "border-[#DFE3E8]",
        error && "border-danger/40 bg-soft-red/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 text-brand-600 ring-1 ring-brand-100">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-heading">
              <span className="font-mono text-muted">({slot.letter})</span> {slot.label}
            </p>
            {compulsory && <Badge variant="danger">Compulsory</Badge>}
            {!compulsory && <Badge variant="secondary">Optional</Badge>}
            {slot.adminOnly && <Badge variant="info">HR only</Badge>}
            {showPhase && (
              <Badge variant="warning" className="capitalize">
                {slot.phase.replace("_", " ")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">{slot.hint}</p>
          {!disabled && (
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
              <FileUp className="h-3.5 w-3.5" />
              {value || received ? "Replace file" : "Choose file / mark received"}
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f.name);
                }}
              />
            </label>
          )}
          {disabled && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Unlocks after probation is completed.
            </p>
          )}
          {(value || received) && (
            <p className="mt-2 truncate text-xs font-medium text-heading">
              {value || "On file"}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}
