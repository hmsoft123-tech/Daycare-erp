"use client";

import { useEffect, useState } from "react";
import { Briefcase, X } from "lucide-react";
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
import type { StaffInquiryCard, StaffRole } from "@/types";

export type HireOfferValues = {
  role: StaffRole;
  offeredSalary: number;
  joiningDate: string;
  employmentType: "full_time" | "part_time" | "contract";
  offerNotes: string;
};

type Props = {
  open: boolean;
  card: StaffInquiryCard | null;
  targetStageLabel: string;
  onCancel: () => void;
  onConfirm: (values: HireOfferValues) => void;
};

export function HireOfferModal({ open, card, targetStageLabel, onCancel, onConfirm }: Props) {
  const [role, setRole] = useState<StaffRole>("teacher");
  const [offeredSalary, setOfferedSalary] = useState("55000");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contract">("full_time");
  const [offerNotes, setOfferNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!card || !open) return;
    setRole(card.role);
    setOfferedSalary(String(card.offeredSalary ?? 55000));
    setJoiningDate(card.joiningDate ?? "");
    setEmploymentType(card.employmentType ?? "full_time");
    setOfferNotes(card.offerNotes ?? "");
  }, [card, open]);

  const resetAndClose = () => {
    setRole(card?.role ?? "teacher");
    setOfferedSalary(String(card?.offeredSalary ?? 55000));
    setJoiningDate("");
    setEmploymentType("full_time");
    setOfferNotes("");
    setErrors({});
    onCancel();
  };

  const submit = () => {
    const salary = Number(offeredSalary);
    const next: Record<string, string> = {};
    if (Number.isNaN(salary) || salary < 0) next.offeredSalary = "Enter a valid salary";
    if (!joiningDate) next.joiningDate = "Joining date required";
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({
      role,
      offeredSalary: salary,
      joiningDate,
      employmentType,
      offerNotes: offerNotes.trim(),
    });
    setJoiningDate("");
    setOfferNotes("");
    setErrors({});
  };

  return (
    <ModalPortal open={open && !!card} onClose={resetAndClose}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Briefcase className="h-5 w-5 text-brand-500" />
            Offer / Hire details
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="salary">Offered salary (PKR / month)</Label>
            <Input
              id="salary"
              type="number"
              min={0}
              className="mt-1"
              value={offeredSalary}
              onChange={(e) => setOfferedSalary(e.target.value)}
            />
            {errors.offeredSalary && <p className="mt-1 text-xs text-danger">{errors.offeredSalary}</p>}
          </div>
          <div>
            <Label htmlFor="joiningDate">Joining date</Label>
            <Input
              id="joiningDate"
              type="date"
              className="mt-1"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
            {errors.joiningDate && <p className="mt-1 text-xs text-danger">{errors.joiningDate}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="offerNotes">Offer notes</Label>
          <Textarea
            id="offerNotes"
            className="mt-1"
            rows={3}
            placeholder="Probation 3 months, benefits package…"
            value={offerNotes}
            onChange={(e) => setOfferNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
        <Button type="button" onClick={submit}>Save &amp; move</Button>
      </div>
    </ModalPortal>
  );
}
