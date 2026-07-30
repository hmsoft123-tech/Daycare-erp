"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { staff } from "@/data/staff";
import {
  SALARY_LINE_PRESETS,
  SALARY_POLICY_BLURB,
  STAFF_SHIFT_OPTIONS,
  activeLinesTotal,
  ensureSalary,
  netMonthlyPay,
} from "@/lib/salary-determination";
import { formatCurrency } from "@/lib/utils";
import type { SalaryLine, SalaryLineKind, Staff, StaffShiftKey } from "@/types";
import { toast } from "sonner";

type Props = {
  member: Staff;
};

export function StaffSalaryPanel({ member }: Props) {
  const initial = ensureSalary(member);
  const [baseSalary, setBaseSalary] = useState(String(initial.baseSalary));
  const [shift, setShift] = useState<StaffShiftKey>(initial.shift);
  const [educationLevel, setEducationLevel] = useState(initial.educationLevel ?? "");
  const [experienceYears, setExperienceYears] = useState(String(initial.experienceYears ?? 0));
  const [yearsAtSdlc, setYearsAtSdlc] = useState(String(initial.yearsAtSdlc ?? 0));
  const [communicationNotes, setCommunicationNotes] = useState(initial.communicationNotes ?? "");
  const [lines, setLines] = useState<SalaryLine[]>(initial.lines ?? []);
  const [presetKey, setPresetKey] = useState(SALARY_LINE_PRESETS[0]?.label ?? "");
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("0");
  const [customKind, setCustomKind] = useState<SalaryLineKind>("adjustment");

  const persist = (patch: {
    baseSalary?: number;
    shift?: StaffShiftKey;
    educationLevel?: string;
    experienceYears?: number;
    yearsAtSdlc?: number;
    communicationNotes?: string;
    lines?: SalaryLine[];
    policyAcknowledgedAt?: string;
  }) => {
    const row = staff.find((s) => s.id === member.id);
    if (!row) return;
    const current = ensureSalary(row);
    row.salary = {
      ...current,
      baseSalary: patch.baseSalary ?? current.baseSalary,
      shift: patch.shift ?? current.shift,
      educationLevel: patch.educationLevel ?? current.educationLevel,
      experienceYears: patch.experienceYears ?? current.experienceYears,
      yearsAtSdlc: patch.yearsAtSdlc ?? current.yearsAtSdlc,
      communicationNotes: patch.communicationNotes ?? current.communicationNotes,
      lines: patch.lines ?? current.lines,
      policyAcknowledgedAt: patch.policyAcknowledgedAt ?? current.policyAcknowledgedAt,
    };
  };

  const persistLines = (next: SalaryLine[]) => {
    setLines(next);
    persist({ lines: next });
  };

  const saveCore = () => {
    const base = Number(baseSalary);
    if (Number.isNaN(base) || base < 0) {
      toast.error("Enter a valid base salary");
      return;
    }
    persist({
      baseSalary: base,
      shift,
      educationLevel: educationLevel.trim() || undefined,
      experienceYears: Number(experienceYears) || 0,
      yearsAtSdlc: Number(yearsAtSdlc) || 0,
      communicationNotes: communicationNotes.trim() || undefined,
      lines,
    });
    toast.success("Salary determination saved — shown on payroll breakdown");
  };

  const addPreset = () => {
    const preset = SALARY_LINE_PRESETS.find((p) => p.label === presetKey);
    if (!preset) return;
    if (lines.some((e) => e.label === preset.label && e.active)) {
      toast.error("This line is already active");
      return;
    }
    const item: SalaryLine = {
      id: `sal-${Date.now()}`,
      label: preset.label,
      amount: preset.amount,
      kind: preset.kind,
      notes: preset.notes,
      active: true,
    };
    persistLines([item, ...lines]);
    toast.success(`${preset.label} added — will appear on payroll`);
  };

  const addCustom = () => {
    if (customLabel.trim().length < 2) {
      toast.error("Label required");
      return;
    }
    const amount = Number(customAmount);
    if (Number.isNaN(amount)) {
      toast.error("Enter a valid amount (negative for deductions)");
      return;
    }
    const item: SalaryLine = {
      id: `sal-${Date.now()}`,
      label: customLabel.trim(),
      amount,
      kind: customKind,
      active: true,
    };
    persistLines([item, ...lines]);
    setCustomLabel("");
    setCustomAmount("0");
    toast.success("Custom salary line added");
  };

  const toggle = (id: string) => {
    persistLines(lines.map((e) => (e.id === id ? { ...e, active: !e.active } : e)));
  };

  const remove = (id: string) => {
    persistLines(lines.filter((e) => e.id !== id));
    toast.success("Line removed");
  };

  const acknowledge = () => {
    const at = new Date().toISOString();
    persist({ policyAcknowledgedAt: at, lines });
    toast.success("Salary & leave hiring policy acknowledgment recorded");
  };

  const draft = {
    baseSalary: Number(baseSalary) || 0,
    shift,
    lines,
  };
  const net = netMonthlyPay(draft);
  const linesImpact = activeLinesTotal(lines);
  const shiftMeta = STAFF_SHIFT_OPTIONS.find((s) => s.key === shift);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand-500" />
          Salary determination
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted">{SALARY_POLICY_BLURB}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl bg-brand-50/60 px-3 py-2 text-sm">
          <span className="text-muted">Estimated net on next payroll: </span>
          <span className="font-semibold text-heading">{formatCurrency(net)}</span>
          <span className="ml-2 text-xs text-muted">
            (base {formatCurrency(Number(baseSalary) || 0)}
            {linesImpact !== 0
              ? ` ${linesImpact > 0 ? "+" : ""}${formatCurrency(linesImpact)} lines`
              : ""}
            )
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="baseSal">Base salary bracket (PKR / month)</Label>
            <Input
              id="baseSal"
              type="number"
              min={0}
              className="mt-1"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-muted">Confidential position bracket (ANNEX)</p>
          </div>
          <div>
            <Label>Department shift</Label>
            <Select value={shift} onValueChange={(v) => setShift(v as StaffShiftKey)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFF_SHIFT_OPTIONS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shiftMeta && <p className="mt-1 text-[10px] text-muted">{shiftMeta.timing}</p>}
          </div>
          <div>
            <Label htmlFor="edu">Education level</Label>
            <Input
              id="edu"
              className="mt-1"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              placeholder="e.g. B.Ed, Masters"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expY">Past experience (yrs)</Label>
              <Input
                id="expY"
                type="number"
                min={0}
                className="mt-1"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sdlcY">Years at SDLC</Label>
              <Input
                id="sdlcY"
                type="number"
                min={0}
                className="mt-1"
                value={yearsAtSdlc}
                onChange={(e) => setYearsAtSdlc(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="comm">Communication / skill notes</Label>
            <Textarea
              id="comm"
              className="mt-1"
              rows={2}
              value={communicationNotes}
              onChange={(e) => setCommunicationNotes(e.target.value)}
              placeholder="Interview & demonstration notes affecting salary"
            />
          </div>
        </div>

        <Button type="button" onClick={saveCore}>
          Save determination
        </Button>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Payroll lines (like student invoice extras)
          </h4>
          {lines.length === 0 ? (
            <p className="text-sm text-muted">
              No adjustments yet. Add education/experience uplifts, overtime, EOBI, late/leave/loan deductions.
            </p>
          ) : (
            <ul className="space-y-2">
              {lines.map((e) => (
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
                    <span
                      className={`font-semibold ${
                        e.amount < 0 || e.kind === "deduction" ? "text-danger" : "text-heading"
                      }`}
                    >
                      {e.amount < 0 || e.kind === "deduction" ? "−" : "+"}
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
        </div>

        <div className="grid gap-3 rounded-xl border border-dashed border-[#DFE3E8] p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>Add policy preset</Label>
            <Select value={presetKey} onValueChange={setPresetKey}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SALARY_LINE_PRESETS.map((p) => (
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
            <Input
              className="mt-1"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Mid-session shift revision"
            />
          </div>
          <div>
            <Label>Amount (PKR)</Label>
            <Input
              className="mt-1"
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-muted">Negative = deduction</p>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={customKind} onValueChange={(v) => setCustomKind(v as SalaryLineKind)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="allowance">Allowance</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
                <SelectItem value="deduction">Deduction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Button type="button" variant="outline" onClick={addCustom}>
              <Plus className="h-4 w-4" />
              Add custom line
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#F1F3F5] bg-bg/60 px-4 py-3 text-xs text-muted">
          <p className="font-semibold text-heading">Hiring / salary policy acknowledgment</p>
          <p className="mt-1">
            Employee understands salary is determined by skills, experience, education, and shift; disbursement
            10th–15th; deductions may include EOBI, late arrivals, leaves, and loans after probation.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={acknowledge}>
            Record acknowledgment on file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
