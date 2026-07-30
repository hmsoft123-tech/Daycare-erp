"use client";

import { useState } from "react";
import { Plus, Trash2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { students } from "@/data/students";
import { STUDENT_EXTRA_PRESETS, activeExtrasTotal } from "@/lib/student-extras";
import { formatCurrency } from "@/lib/utils";
import type { Student, StudentExtra, StudentExtraKind } from "@/types";
import { toast } from "sonner";

type Props = {
  student: Student;
  onChange?: (extras: StudentExtra[]) => void;
};

export function StudentExtrasPanel({ student, onChange }: Props) {
  const [extras, setExtras] = useState<StudentExtra[]>(student.extras ?? []);
  const [presetKey, setPresetKey] = useState(STUDENT_EXTRA_PRESETS[0]?.label ?? "");
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("0");
  const [customKind, setCustomKind] = useState<StudentExtraKind>("addon");

  const persist = (next: StudentExtra[]) => {
    setExtras(next);
    const row = students.find((s) => s.id === student.id);
    if (row) row.extras = next;
    onChange?.(next);
  };

  const addPreset = () => {
    const preset = STUDENT_EXTRA_PRESETS.find((p) => p.label === presetKey);
    if (!preset) return;
    if (extras.some((e) => e.label === preset.label && e.active)) {
      toast.error("This extra is already active on the student");
      return;
    }
    const item: StudentExtra = {
      id: `ex-${Date.now()}`,
      label: preset.label,
      amount: preset.amount,
      kind: preset.kind,
      notes: preset.notes,
      active: true,
    };
    persist([item, ...extras]);
    toast.success(`${preset.label} added — will appear on next invoice`);
  };

  const addCustom = () => {
    if (customLabel.trim().length < 2) {
      toast.error("Label required");
      return;
    }
    const amount = Number(customAmount);
    if (Number.isNaN(amount)) {
      toast.error("Enter a valid amount (use negative for benefits/credits)");
      return;
    }
    const item: StudentExtra = {
      id: `ex-${Date.now()}`,
      label: customLabel.trim(),
      amount,
      kind: customKind,
      active: true,
    };
    persist([item, ...extras]);
    setCustomLabel("");
    setCustomAmount("0");
    toast.success("Custom extra added");
  };

  const toggle = (id: string) => {
    persist(extras.map((e) => (e.id === id ? { ...e, active: !e.active } : e)));
  };

  const remove = (id: string) => {
    persist(extras.filter((e) => e.id !== id));
    toast.success("Extra removed");
  };

  const monthlyImpact = activeExtrasTotal(extras);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-brand-500" />
          Extra benefits &amp; add-ons
        </CardTitle>
        <p className="text-xs text-muted">
          Active items are auto-added as invoice line items when you generate a fee invoice for this student.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl bg-brand-50/60 px-3 py-2 text-sm">
          <span className="text-muted">Active extras on next invoice: </span>
          <span className="font-semibold text-heading">
            {monthlyImpact >= 0 ? "+" : ""}
            {formatCurrency(monthlyImpact)}
          </span>
        </div>

        {extras.length === 0 ? (
          <p className="text-sm text-muted">No extras yet. Add a preset or custom benefit/charge below.</p>
        ) : (
          <ul className="space-y-2">
            {extras.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F1F3F5] px-3 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Checkbox checked={e.active} onCheckedChange={() => toggle(e.id)} />
                  <div>
                    <p className="font-medium text-heading">{e.label}</p>
                    <p className="text-[11px] capitalize text-muted">
                      {e.kind}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${e.amount < 0 ? "text-brand-700" : "text-heading"}`}>
                    {e.amount < 0 ? "−" : "+"}
                    {formatCurrency(Math.abs(e.amount))}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => remove(e.id)} aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 rounded-xl border border-dashed border-[#DFE3E8] p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>Add preset</Label>
            <Select value={presetKey} onValueChange={setPresetKey}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STUDENT_EXTRA_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>
                    {p.label} ({p.amount < 0 ? "−" : "+"}
                    {formatCurrency(Math.abs(p.amount))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={addPreset}>
              <Plus className="h-4 w-4" />
              Add preset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#F1F3F5] p-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Custom label</Label>
            <Input className="mt-1" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. Transport support" />
          </div>
          <div>
            <Label>Amount (PKR)</Label>
            <Input className="mt-1" type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
            <p className="mt-1 text-[10px] text-muted">Negative = benefit/credit</p>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={customKind} onValueChange={(v) => setCustomKind(v as StudentExtraKind)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="benefit">Benefit</SelectItem>
                <SelectItem value="addon">Add-on</SelectItem>
                <SelectItem value="charge">Charge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Button type="button" variant="outline" onClick={addCustom}>
              <Plus className="h-4 w-4" />
              Add custom extra
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
