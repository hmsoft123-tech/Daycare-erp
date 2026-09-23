"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import { LastUpdated } from "@/components/common/LastUpdated";
import { branches } from "@/data/branches";
import { PROGRAM_CATEGORIES } from "@/data/special-programs";
import { saveSpecialProgram } from "@/lib/mock-service";
import type { ProgramCategory, ProgramStatus, SpecialProgram } from "@/types";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";

const STATUSES: { value: ProgramStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "open", label: "Registration open" },
  { value: "closed", label: "Registration closed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type Props = {
  open: boolean;
  program?: SpecialProgram | null;
  defaultCategory?: ProgramCategory;
  onClose: () => void;
  onSaved: (p: SpecialProgram) => void;
};

export function ProgramFormModal({ open, program, defaultCategory, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProgramCategory>("summer_camp");
  const [branchId, setBranchId] = useState(branches[0].id);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("0");
  const [voucherRequired, setVoucherRequired] = useState(true);
  const [voucherDueDays, setVoucherDueDays] = useState("7");
  const [openToExternal, setOpenToExternal] = useState(true);
  const [status, setStatus] = useState<ProgramStatus>("open");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(program?.name ?? "");
    setCategory(program?.category ?? defaultCategory ?? "summer_camp");
    setBranchId(program?.branchId ?? branches[0].id);
    setDescription(program?.description ?? "");
    setStartDate(program?.startDate ?? "");
    setEndDate(program?.endDate ?? "");
    setAgeGroup(program?.ageGroup ?? "");
    setCapacity(program?.capacity ? String(program.capacity) : "");
    setFee(String(program?.fee ?? 0));
    setVoucherRequired(program?.voucherRequired ?? true);
    setVoucherDueDays(String(program?.voucherDueDays ?? 7));
    setOpenToExternal(program?.openToExternal ?? true);
    setStatus(program?.status ?? "open");
    setErrors({});
  }, [open, program, defaultCategory]);

  const feeNum = Number(fee);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Program name required";
    if (!startDate) next.startDate = "Start date required";
    if (!endDate) next.endDate = "End date required";
    if (startDate && endDate && endDate < startDate) next.endDate = "End date is before start date";
    if (Number.isNaN(feeNum) || feeNum < 0) next.fee = "Enter a valid fee (0 for free)";
    if (capacity && (Number.isNaN(Number(capacity)) || Number(capacity) < 1)) next.capacity = "Invalid capacity";
    setErrors(next);
    if (Object.keys(next).length) return;

    const saved = await saveSpecialProgram({
      id: program?.id,
      name: name.trim(),
      category,
      branchId,
      description: description.trim() || undefined,
      startDate,
      endDate,
      ageGroup: ageGroup.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      fee: feeNum,
      voucherRequired: feeNum > 0 && voucherRequired,
      voucherDueDays: Number(voucherDueDays) || 7,
      openToExternal,
      status,
    });
    onSaved({ ...saved });
    toast.success(program ? "Program updated" : "Program created");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <CalendarPlus className="h-5 w-5 text-brand-500" />
            {program ? "Edit program" : "New program / activity"}
          </h2>
          {program ? (
            <LastUpdated stamp={program.lastUpdated} className="mt-1" />
          ) : (
            <p className="mt-1 text-sm text-muted">Camps, trips, workshops, events and other short-term programs.</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pname">Program name</Label>
            <Input id="pname" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as ProgramCategory)}>
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Hosting branch</Label>
            <select className={selectClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pstart">Start date</Label>
            <Input id="pstart" type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {errors.startDate && <p className="mt-1 text-xs text-danger">{errors.startDate}</p>}
          </div>
          <div>
            <Label htmlFor="pend">End date</Label>
            <Input id="pend" type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {errors.endDate && <p className="mt-1 text-xs text-danger">{errors.endDate}</p>}
          </div>
          <div>
            <Label htmlFor="page">Age group</Label>
            <Input id="page" className="mt-1" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="e.g. 3 – 6 years" />
          </div>
          <div>
            <Label htmlFor="pcap">Capacity (seats)</Label>
            <Input id="pcap" type="number" min={1} className="mt-1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" />
            {errors.capacity && <p className="mt-1 text-xs text-danger">{errors.capacity}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea id="pdesc" rows={2} className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-heading">Fee & payment</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="pfee">Fee per child (PKR)</Label>
              <Input id="pfee" type="number" min={0} className="mt-1" value={fee} onChange={(e) => setFee(e.target.value)} />
              {errors.fee && <p className="mt-1 text-xs text-danger">{errors.fee}</p>}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-heading">Generate separate voucher</p>
                <p className="text-[11px] text-muted">
                  Off = amount & payment are still recorded against each registration, without a voucher.
                </p>
              </div>
              <Switch checked={feeNum > 0 && voucherRequired} disabled={!(feeNum > 0)} onCheckedChange={setVoucherRequired} />
            </div>
            {feeNum > 0 && voucherRequired && (
              <div>
                <Label htmlFor="pdue">Voucher due (days)</Label>
                <Input id="pdue" type="number" min={1} className="mt-1" value={voucherDueDays} onChange={(e) => setVoucherDueDays(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2">
            <div>
              <p className="text-sm font-medium text-heading">Open to outside children</p>
              <p className="text-[11px] text-muted">Allow non-enrolled children to register</p>
            </div>
            <Switch checked={openToExternal} onCheckedChange={setOpenToExternal} />
          </div>
          <div>
            <Label>Status</Label>
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as ProgramStatus)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>{program ? "Save changes" : "Create program"}</Button>
      </div>
    </ModalPortal>
  );
}

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label])
) as Record<ProgramStatus, string>;
