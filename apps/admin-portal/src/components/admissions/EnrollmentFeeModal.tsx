"use client";

import { useState } from "react";
import { Receipt, X } from "lucide-react";
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
import type { AdmissionCard, DiscountType } from "@/types";

export type EnrollmentFeeValues = {
  monthlyTuition: number;
  admissionFee: number;
  discountType: DiscountType;
  discountValue: number;
  feeNotes: string;
};

type Props = {
  open: boolean;
  card: AdmissionCard | null;
  targetStageLabel: string;
  onCancel: () => void;
  onConfirm: (values: EnrollmentFeeValues) => void;
};

export function EnrollmentFeeModal({
  open,
  card,
  targetStageLabel,
  onCancel,
  onConfirm,
}: Props) {
  const [monthlyTuition, setMonthlyTuition] = useState("80000");
  const [admissionFee, setAdmissionFee] = useState("5000");
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("0");
  const [feeNotes, setFeeNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setMonthlyTuition("80000");
    setAdmissionFee("5000");
    setDiscountType("none");
    setDiscountValue("0");
    setFeeNotes("");
    setErrors({});
    onCancel();
  };

  const submit = () => {
    const tuition = Number(monthlyTuition);
    const admission = Number(admissionFee);
    const discount = Number(discountValue);
    const next: Record<string, string> = {};
    if (Number.isNaN(tuition) || tuition < 0) next.monthlyTuition = "Enter a valid tuition";
    if (Number.isNaN(admission) || admission < 0) next.admissionFee = "Enter a valid admission fee";
    if (discountType !== "none" && (Number.isNaN(discount) || discount < 0)) {
      next.discountValue = "Enter a valid discount";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({
      monthlyTuition: tuition,
      admissionFee: admission,
      discountType,
      discountValue: discountType === "none" ? 0 : discount,
      feeNotes: feeNotes.trim(),
    });
    setMonthlyTuition("80000");
    setAdmissionFee("5000");
    setDiscountType("none");
    setDiscountValue("0");
    setFeeNotes("");
    setErrors({});
  };

  return (
    <ModalPortal open={open && !!card} onClose={resetAndClose}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Receipt className="h-5 w-5 text-brand-500" />
            Enrollment Fees
          </h2>
          {card && (
            <p className="mt-1 text-sm text-muted">
              Moving <span className="font-semibold text-heading">{card.studentName}</span> to {targetStageLabel}
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
            <Label htmlFor="monthlyTuition">Monthly tuition (PKR)</Label>
            <Input
              id="monthlyTuition"
              type="number"
              min={0}
              className="mt-1"
              value={monthlyTuition}
              onChange={(e) => setMonthlyTuition(e.target.value)}
            />
            {errors.monthlyTuition && (
              <p className="mt-1 text-xs text-danger">{errors.monthlyTuition}</p>
            )}
          </div>
          <div>
            <Label htmlFor="admissionFee">Admission fee (PKR)</Label>
            <Input
              id="admissionFee"
              type="number"
              min={0}
              className="mt-1"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(e.target.value)}
            />
            {errors.admissionFee && (
              <p className="mt-1 text-xs text-danger">{errors.admissionFee}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Discount type</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No discount</SelectItem>
                <SelectItem value="percent">Percent (%)</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
                <SelectItem value="sibling">Sibling discount</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
                <SelectItem value="staff">Staff discount</SelectItem>
                <SelectItem value="promo">Promo / campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="discountValue">
              Discount value {discountType === "percent" ? "(%)" : "(PKR)"}
            </Label>
            <Input
              id="discountValue"
              type="number"
              min={0}
              className="mt-1"
              disabled={discountType === "none"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
            {errors.discountValue && (
              <p className="mt-1 text-xs text-danger">{errors.discountValue}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="feeNotes">Fee notes</Label>
          <Textarea
            id="feeNotes"
            className="mt-1"
            rows={3}
            placeholder="e.g. Waived registration for early signup; discount applies to tuition only…"
            value={feeNotes}
            onChange={(e) => setFeeNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={resetAndClose}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save fees &amp; move
        </Button>
      </div>
    </ModalPortal>
  );
}
