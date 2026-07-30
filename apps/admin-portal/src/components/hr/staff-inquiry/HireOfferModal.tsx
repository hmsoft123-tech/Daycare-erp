"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Copy, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmployeeFileSlot } from "@/components/hr/employee-file/EmployeeFileSlot";
import {
  emptyEmployeeFile,
  entryMap,
  mergeEmployeeFile,
  missingRequiredHire,
  slotsForAdminHire,
} from "@/lib/employee-file";
import {
  buildHireInviteUrl,
  createHireInvite,
} from "@/lib/hire-invite-store";
import type {
  EmployeeFileEntry,
  EmployeeFileSlotKey,
  StaffInquiryCard,
  StaffRole,
} from "@/types";
import { toast } from "sonner";

export type HireOfferValues = {
  role: StaffRole;
  offeredSalary: number;
  joiningDate: string;
  employmentType: "full_time" | "part_time" | "contract";
  offerNotes: string;
  probationMonths: number;
  employeeFile: EmployeeFileEntry[];
  hireInviteToken?: string;
  /** When true, do not create staff yet — invite candidate to /apply */
  sendInviteOnly?: boolean;
};

type Props = {
  open: boolean;
  card: StaffInquiryCard | null;
  targetStageLabel: string;
  targetIsHired: boolean;
  onCancel: () => void;
  onConfirm: (values: HireOfferValues) => void;
};

export function HireOfferModal({
  open,
  card,
  targetStageLabel,
  targetIsHired,
  onCancel,
  onConfirm,
}: Props) {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [offeredSalary, setOfferedSalary] = useState("55000");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contract">("full_time");
  const [offerNotes, setOfferNotes] = useState("");
  const [probationMonths, setProbationMonths] = useState("3");
  const [mode, setMode] = useState<"file" | "invite">("invite");
  const [file, setFile] = useState<EmployeeFileEntry[]>(emptyEmployeeFile());
  const [inviteUrl, setInviteUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hireSlots = useMemo(() => slotsForAdminHire(), []);
  const map = entryMap(file);

  useEffect(() => {
    if (!card || !open) return;
    setRole(card.role);
    setOfferedSalary(String(card.offeredSalary ?? 55000));
    setJoiningDate(card.joiningDate ?? "");
    setEmploymentType(card.employmentType ?? "full_time");
    setOfferNotes(card.offerNotes ?? "");
    setProbationMonths(String(card.probationMonths ?? 3));
    setFile(card.employeeFile?.length ? card.employeeFile : emptyEmployeeFile());
    setMode(targetIsHired ? "file" : "invite");
    setInviteUrl("");
    setErrors({});
  }, [card, open, targetIsHired]);

  const resetAndClose = () => {
    setErrors({});
    setInviteUrl("");
    onCancel();
  };

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

  const mintInvite = () => {
    if (!card) return;
    const salary = Number(offeredSalary);
    if (Number.isNaN(salary) || salary < 0) {
      setErrors({ offeredSalary: "Enter a valid salary" });
      return;
    }
    if (!joiningDate && targetIsHired) {
      setErrors({ joiningDate: "Joining date required" });
      return;
    }
    const invite = createHireInvite({
      email: card.email,
      candidateName: card.name,
      inquiryId: card.id,
      prefill: {
        name: card.name,
        email: card.email,
        phone: card.phone,
        role,
        branchId: card.branchId,
        offeredSalary: salary,
        joiningDate: joiningDate || undefined,
        employmentType,
        probationMonths: Number(probationMonths) || 3,
      },
    });
    const url = buildHireInviteUrl(invite.token);
    setInviteUrl(url);
    toast.success("Secure apply link created");
    return invite.token;
  };

  const copyInvite = async () => {
    const token = inviteUrl ? undefined : mintInvite();
    const url = inviteUrl || (token ? buildHireInviteUrl(token) : "");
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Apply link copied");
    } catch {
      toast.message(url);
    }
  };

  const submit = () => {
    const salary = Number(offeredSalary);
    const months = Number(probationMonths);
    const next: Record<string, string> = {};
    if (Number.isNaN(salary) || salary < 0) next.offeredSalary = "Enter a valid salary";
    if (!joiningDate && (targetIsHired || mode === "file")) next.joiningDate = "Joining date required";
    if (Number.isNaN(months) || months < 0) next.probationMonths = "Valid probation months required";

    if (mode === "file" && targetIsHired) {
      const missing = missingRequiredHire(file, "admin");
      // staff_id_card is generated on hire — allow missing that one in modal
      const blocking = missing.filter((m) => m.key !== "staff_id_card");
      if (blocking.length) {
        next.file = `Compulsory hire docs missing: ${blocking.map((m) => `(${m.letter})`).join(" ")}`;
        for (const m of blocking) next[`slot_${m.key}`] = "Required";
      }
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    if (mode === "invite") {
      const existingToken = inviteUrl.split("/apply/")[1]?.split("?")[0];
      const mintedToken = existingToken || mintInvite() || "";
      if (!mintedToken) return;
      onConfirm({
        role,
        offeredSalary: salary,
        joiningDate,
        employmentType,
        offerNotes: offerNotes.trim(),
        probationMonths: months,
        employeeFile: file,
        hireInviteToken: mintedToken,
        sendInviteOnly: !targetIsHired,
      });
      return;
    }

    onConfirm({
      role,
      offeredSalary: salary,
      joiningDate,
      employmentType,
      offerNotes: offerNotes.trim(),
      probationMonths: months,
      employeeFile: file,
      sendInviteOnly: false,
    });
  };

  return (
    <ModalPortal open={open && !!card} onClose={resetAndClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Briefcase className="h-5 w-5 text-brand-500" />
            Offer / Hire + Employee file
          </h2>
          {card && (
            <p className="mt-1 text-sm text-muted">
              Moving <span className="font-semibold text-heading">{card.name}</span> to {targetStageLabel}
            </p>
          )}
        </div>
        <button type="button" onClick={resetAndClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="therapist">Therapist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Employment type</Label>
            <Select
              value={employmentType}
              onValueChange={(v) => setEmploymentType(v as "full_time" | "part_time" | "contract")}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full time</SelectItem>
                <SelectItem value="part_time">Part time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="salary">Offered salary (PKR)</Label>
            <Input id="salary" type="number" min={0} className="mt-1" value={offeredSalary} onChange={(e) => setOfferedSalary(e.target.value)} />
            {errors.offeredSalary && <p className="mt-1 text-xs text-danger">{errors.offeredSalary}</p>}
          </div>
          <div>
            <Label htmlFor="joiningDate">Joining date</Label>
            <Input id="joiningDate" type="date" className="mt-1" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
            {errors.joiningDate && <p className="mt-1 text-xs text-danger">{errors.joiningDate}</p>}
          </div>
          <div>
            <Label htmlFor="probation">Probation (months)</Label>
            <Input id="probation" type="number" min={0} className="mt-1" value={probationMonths} onChange={(e) => setProbationMonths(e.target.value)} />
            {errors.probationMonths && <p className="mt-1 text-xs text-danger">{errors.probationMonths}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="offerNotes">Offer notes</Label>
          <Textarea
            id="offerNotes"
            className="mt-1"
            rows={2}
            placeholder="Benefits, campus, reporting manager…"
            value={offerNotes}
            onChange={(e) => setOfferNotes(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-[#F1F3F5] p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Completion mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "invite" ? "default" : "outline"}
              onClick={() => setMode("invite")}
            >
              <Link2 className="h-3.5 w-3.5" />
              Public apply link (hiring fields only)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "file" ? "default" : "outline"}
              onClick={() => setMode("file")}
            >
              Admin employee file (all hire fields)
            </Button>
          </div>
        </div>

        {mode === "invite" && (
          <div className="space-y-3 rounded-xl bg-brand-50/60 px-4 py-3">
            <p className="text-sm text-heading">
              Candidate completes a secure form like student enrollment — only documents needed at
              hiring. HR annexes stay on the admin employee file.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyInvite}>
                <Copy className="h-3.5 w-3.5" />
                {inviteUrl ? "Copy link again" : "Create & copy apply link"}
              </Button>
              <Badge variant="secondary">Demo: /apply/demo-apply-2025</Badge>
            </div>
            {inviteUrl && (
              <p className="break-all rounded-lg bg-white px-2 py-1.5 font-mono text-[11px] text-muted">
                {inviteUrl}
              </p>
            )}
          </div>
        )}

        {mode === "file" && (
          <div className="space-y-3">
            <p className="text-xs text-muted">
              All hire-phase slots (a–p relevant). Compulsory items must be marked before hiring.
              Post-probation / exit annexes are edited later on the staff profile.
            </p>
            <div className="grid max-h-72 gap-3 overflow-y-auto sm:grid-cols-1">
              {hireSlots.map((slot) => (
                <EmployeeFileSlot
                  key={slot.key}
                  slot={slot}
                  value={map[slot.key]?.fileName}
                  received={map[slot.key]?.received}
                  error={errors[`slot_${slot.key}`]}
                  onFile={(n) => setSlot(slot.key, n)}
                />
              ))}
            </div>
            {errors.file && <p className="text-xs text-danger">{errors.file}</p>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          {mode === "invite"
            ? targetIsHired
              ? "Save invite & move to Hired"
              : "Save offer + invite"
            : "Save file & move"}
        </Button>
      </div>
    </ModalPortal>
  );
}
