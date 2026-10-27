"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Loader2, X } from "lucide-react";
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
import { ALL_PROGRAMS, SERVICE_TYPES, validateDiscount, type DiscountForm } from "@/lib/fees-api";
import type { BranchOption } from "@/lib/hooks/use-branches";

const COMPANY_WIDE = "__company";

type Props = {
  open: boolean;
  editing: boolean;
  initial: DiscountForm;
  branches: BranchOption[];
  programs: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (form: DiscountForm) => void;
};

/** Create / edit a discount template staff can pick by code when proposing fees. */
export function DiscountRuleModal({ open, editing, initial, branches, programs, saving, onCancel, onSave }: Props) {
  const [form, setForm] = useState<DiscountForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setErrors({});
  }, [open, initial]);

  const set = <K extends keyof DiscountForm>(key: K, value: DiscountForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const next = validateDiscount(form);
    setErrors(next);
    if (!Object.keys(next).length) onSave(form);
  };

  const close = saving ? () => {} : onCancel;

  return (
    <ModalPortal open={open} onClose={close} closeOnBackdrop={!saving}>
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <BadgePercent className="h-5 w-5 text-brand-500" />
            {editing ? "Edit discount" : "Add discount"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Staff apply discounts by code; the server works out the amount from these rules.
          </p>
        </div>
        <button type="button" onClick={close} disabled={saving} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="discountName">Name</Label>
            <Input
              id="discountName"
              className="mt-1"
              placeholder="Sibling Discount"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="discountCode">Code</Label>
            <Input
              id="discountCode"
              className="mt-1 font-mono uppercase"
              placeholder="SIBLING10"
              value={form.discountCode}
              disabled={editing}
              onChange={(e) => set("discountCode", e.target.value.toUpperCase().replace(/\s+/g, ""))}
            />
            {errors.discountCode && <p className="mt-1 text-xs text-danger">{errors.discountCode}</p>}
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.discountType} onValueChange={(v) => set("discountType", v as DiscountForm["discountType"])}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                <SelectItem value="FIXED_AMOUNT">Fixed amount (PKR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="discountValue">Value {form.discountType === "PERCENTAGE" ? "(%)" : "(PKR)"}</Label>
            <Input
              id="discountValue"
              className="mt-1"
              type="number"
              min={0}
              max={form.discountType === "PERCENTAGE" ? 100 : undefined}
              step="0.01"
              inputMode="decimal"
              value={form.discountValue}
              onChange={(e) => set("discountValue", e.target.value)}
            />
            {errors.discountValue && <p className="mt-1 text-xs text-danger">{errors.discountValue}</p>}
          </div>
          <div>
            <Label>Applies to fee</Label>
            <Select value={form.applicableServiceType} onValueChange={(v) => set("applicableServiceType", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PROGRAMS}>Whole gross amount</SelectItem>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="discountGrade">Program / grade</Label>
            <Input
              id="discountGrade"
              className="mt-1"
              list="discountPrograms"
              value={form.applicableGrade}
              onChange={(e) => set("applicableGrade", e.target.value)}
            />
            <datalist id="discountPrograms">
              <option value={ALL_PROGRAMS}>Every program</option>
              {programs.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={form.branchCode || COMPANY_WIDE} onValueChange={(v) => set("branchCode", v === COMPANY_WIDE ? "" : v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMPANY_WIDE}>All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.code} value={b.code}>
                    {b.name} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-heading">
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
          {editing ? "Save changes" : "Create discount"}
        </Button>
      </div>
    </ModalPortal>
  );
}
