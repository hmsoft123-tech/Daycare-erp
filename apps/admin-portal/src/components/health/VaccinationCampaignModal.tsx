"use client";

import { useEffect, useMemo, useState } from "react";
import { Syringe, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import { branches } from "@/data/branches";
import { recordVaccinationCampaign } from "@/lib/mock-service";
import { todayIso } from "@/lib/fee-challan";
import type { HealthRecord, VaccinationCampaign } from "@/types";
import type { HealthPerson } from "@/components/health/HealthRecordModal";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";

type Audience = VaccinationCampaign["audience"];

type Props = {
  open: boolean;
  people: HealthPerson[];
  onClose: () => void;
  onSaved: (c: VaccinationCampaign, records: HealthRecord[]) => void;
};

/** Log a campaign whenever conducted — creates a vaccination record for each person covered */
export function VaccinationCampaignModal({ open, people, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [vaccine, setVaccine] = useState("");
  const [polio, setPolio] = useState(true);
  const [date, setDate] = useState(todayIso());
  const [audience, setAudience] = useState<Audience>("student");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [conductedBy, setConductedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [covered, setCovered] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const key = (p: HealthPerson) => `${p.subject}:${p.id}`;

  const eligible = useMemo(
    () =>
      people.filter(
        (p) => (audience === "both" || p.subject === audience) && branchIds.includes(p.branchId)
      ),
    [people, audience, branchIds]
  );

  useEffect(() => {
    if (!open) return;
    setName("");
    setVaccine("OPV (oral polio)");
    setPolio(true);
    setDate(todayIso());
    setAudience("student");
    setBranchIds(branches.map((b) => b.id));
    setConductedBy("");
    setNotes("");
    setErrors({});
  }, [open]);

  // Everyone eligible is covered by default; untick absentees
  useEffect(() => setCovered(new Set(eligible.map(key))), [eligible]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Campaign name required";
    if (vaccine.trim().length < 2) next.vaccine = "Vaccine required";
    if (branchIds.length === 0) next.branches = "Select at least one branch";
    if (covered.size === 0) next.people = "No one selected";
    setErrors(next);
    if (Object.keys(next).length) return;

    const { campaign, records } = await recordVaccinationCampaign({
      name: name.trim(),
      vaccine: vaccine.trim(),
      date,
      audience,
      branchIds,
      conductedBy: conductedBy.trim() || "—",
      notes: notes.trim() || undefined,
      polio,
      people: eligible
        .filter((p) => covered.has(key(p)))
        .map((p) => ({ subject: p.subject, personId: p.id, personName: p.name, branchId: p.branchId })),
    });
    onSaved({ ...campaign }, records.map((r) => ({ ...r })));
    toast.success(`Campaign recorded · ${records.length} vaccination record(s) created`);
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Syringe className="h-5 w-5 text-brand-500" />
            Record vaccination campaign
          </h2>
          <p className="mt-1 text-sm text-muted">Polio drives, staff hepatitis drives and any other campaign conducted.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="vcname">Campaign name</Label>
            <Input id="vcname" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. National Polio Campaign — October 2026" />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="vcvac">Vaccine</Label>
            <Input id="vcvac" className="mt-1" value={vaccine} onChange={(e) => setVaccine(e.target.value)} />
            {errors.vaccine && <p className="mt-1 text-xs text-danger">{errors.vaccine}</p>}
            <label className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={polio} onChange={(e) => setPolio(e.target.checked)} />
              Record as Polio Vaccination for students
            </label>
          </div>
          <div>
            <Label htmlFor="vcdate">Date conducted</Label>
            <Input id="vcdate" type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Audience</Label>
            <select className={selectClass} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="both">Students & staff</option>
            </select>
          </div>
          <div>
            <Label htmlFor="vcby">Conducted by</Label>
            <Input id="vcby" className="mt-1" value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} placeholder="e.g. EPI Sindh team" />
          </div>
          <div className="sm:col-span-2">
            <Label>Branches</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {branches.map((b) => (
                <label key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-xs text-heading">
                  <input
                    type="checkbox"
                    checked={branchIds.includes(b.id)}
                    onChange={(e) =>
                      setBranchIds((prev) => (e.target.checked ? [...prev, b.id] : prev.filter((x) => x !== b.id)))
                    }
                  />
                  {b.name.replace(" Campus", "")}
                </label>
              ))}
            </div>
            {errors.branches && <p className="mt-1 text-xs text-danger">{errors.branches}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="vcnotes">Notes</Label>
            <Textarea id="vcnotes" rows={2} className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-heading">
              Covered · {covered.size} of {eligible.length}
            </p>
            <div className="flex gap-3 text-xs font-semibold text-brand-600">
              <button type="button" onClick={() => setCovered(new Set(eligible.map(key)))}>All</button>
              <button type="button" onClick={() => setCovered(new Set())}>None</button>
            </div>
          </div>
          <div className="mt-2 grid max-h-52 gap-1 overflow-y-auto sm:grid-cols-2">
            {eligible.map((p) => (
              <label key={key(p)} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-bg">
                <input
                  type="checkbox"
                  checked={covered.has(key(p))}
                  onChange={(e) =>
                    setCovered((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(key(p));
                      else next.delete(key(p));
                      return next;
                    })
                  }
                />
                <span className="truncate text-heading">{p.name}</span>
                <span className="ml-auto shrink-0 text-[11px] capitalize text-muted">{p.subject}</span>
              </label>
            ))}
            {eligible.length === 0 && <p className="text-xs text-muted">No one in the selected branches.</p>}
          </div>
          {errors.people && <p className="mt-1 text-xs text-danger">{errors.people}</p>}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>Save campaign</Button>
      </div>
    </ModalPortal>
  );
}
