"use client";

import { useEffect, useState } from "react";
import { Loader2, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_PROGRAMS,
  BILLING_CYCLES,
  SERVICE_TYPES,
  validateFeeRule,
  type BillingCycle,
  type FeeRuleForm,
  type ServiceType,
} from "@/lib/fees-api";
import type { BranchOption } from "@/lib/hooks/use-branches";

const COMPANY_WIDE = "__company";

type Props = {
  open: boolean;
  /** Set when editing an existing rule */
  editing: boolean;
  initial: FeeRuleForm;
  branches: BranchOption[];
  /** Existing program names, offered as suggestions */
  programs: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (form: FeeRuleForm) => void;
};

/** Create / edit one `FeeStructure` rule (a program's core fee or an optional add-on service). */
export function FeeRuleModal({ open, editing, initial, branches, programs, saving, onCancel, onSave }: Props) {
  const [form, setForm] = useState<FeeRuleForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setErrors({});
  }, [open, initial]);

  const set = <K extends keyof FeeRuleForm>(key: K, value: FeeRuleForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const next = validateFeeRule(form);
    setErrors(next);
    if (!Object.keys(next).length) onSave(form);
  };

  const close = saving ? () => {} : onCancel;

  return (
    <ModalPortal open={open} onClose={close} closeOnBackdrop={!saving}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Receipt className="h-5 w-5 text-brand-500" />
            {editing ? "Edit fee rule" : form.isAdditionalService ? "Add optional service" : "Add program fee"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {form.isAdditionalService
              ? "Staff can tick this service when proposing fees, or subscribe an enrolled student to it."
              : "Charged to every child in the program — staff cannot change the amount when proposing fees."}
          </p>
        </div>
        <button type="button" onClick={close} disabled={saving} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label htmlFor="feeRuleName">Fee name</Label>
          <Input
            id="feeRuleName"
            className="mt-1"
            placeholder={form.isAdditionalService ? "Quran & Tajweed Class" : "Monthly Toddler Tuition"}
            value={form.feeName}
            onChange={(e) => set("feeName", e.target.value)}
          />
          {errors.feeName && <p className="mt-1 text-xs text-danger">{errors.feeName}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="feeRuleProgram">Program / grade</Label>
            <Input
              id="feeRuleProgram"
              className="mt-1"
              list="feeRulePrograms"
              placeholder={`Toddler, Nursery… or ${ALL_PROGRAMS}`}
              value={form.gradeOrProgram}
              onChange={(e) => set("gradeOrProgram", e.target.value)}
            />
            <datalist id="feeRulePrograms">
              <option value={ALL_PROGRAMS}>Every program</option>
              {programs.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {errors.gradeOrProgram && <p className="mt-1 text-xs text-danger">{errors.gradeOrProgram}</p>}
          </div>
          <div>
            <Label>Applies to</Label>
            <Select value={form.branchCode || COMPANY_WIDE} onValueChange={(v) => set("branchCode", v === COMPANY_WIDE ? "" : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMPANY_WIDE}>All branches (company-wide)</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.name} only (branch price)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service type</Label>
            <Select value={form.serviceType} onValueChange={(v) => set("serviceType", v as ServiceType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billing cycle</Label>
            <Select value={form.billingCycle} onValueChange={(v) => set("billingCycle", v as BillingCycle)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="feeRuleAmount">Amount (PKR)</Label>
            <Input
              id="feeRuleAmount"
              className="mt-1"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={form.baseAmount}
              onChange={(e) => set("baseAmount", e.target.value)}
            />
            {errors.baseAmount && <p className="mt-1 text-xs text-danger">{errors.baseAmount}</p>}
          </div>
          <div>
            <Label htmlFor="feeRuleOrder">Display order (optional)</Label>
            <Input
              id="feeRuleOrder"
              className="mt-1"
              type="number"
              step="1"
              value={form.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
            />
            {errors.displayOrder && <p className="mt-1 text-xs text-danger">{errors.displayOrder}</p>}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-heading">
            <Switch checked={form.isAdditionalService} onCheckedChange={(v) => set("isAdditionalService", v)} />
            Optional add-on
          </label>
          <label className="flex items-center gap-2 text-sm text-heading">
            <Switch checked={form.isTaxable} onCheckedChange={(v) => set("isTaxable", v)} />
            Taxable
          </label>
          <label className="flex items-center gap-2 text-sm text-heading">
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
            Active
          </label>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={saving} onClick={submit}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Create rule"}
        </Button>
      </div>
    </ModalPortal>
  );
}
