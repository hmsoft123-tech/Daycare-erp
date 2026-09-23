"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartPulse, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import { LastUpdated } from "@/components/common/LastUpdated";
import {
  HEALTH_CATEGORIES,
  HEALTH_FREQUENCY_LABEL,
  HEALTH_OUTCOME_LABEL,
} from "@/data/health-safety";
import { saveHealthRecord } from "@/lib/mock-service";
import { todayIso } from "@/lib/fee-challan";
import type {
  HealthFrequency,
  HealthOutcome,
  HealthRecord,
  HealthRecordCategory,
  HealthSubject,
} from "@/types";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";

export type HealthPerson = { id: string; name: string; branchId: string; subject: HealthSubject; detail?: string };

/** Suggested next due date from frequency */
export function nextDueFor(date: string, frequency: HealthFrequency): string | undefined {
  if (!date) return undefined;
  const d = new Date(date + "T12:00:00");
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "bi_annual") d.setMonth(d.getMonth() + 6);
  else if (frequency === "annual") d.setFullYear(d.getFullYear() + 1);
  else return undefined;
  return d.toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  record?: HealthRecord | null;
  /** Preset for quick actions (e.g. "record hygiene check for X") */
  preset?: Partial<Pick<HealthRecord, "subject" | "personId" | "category">>;
  people: HealthPerson[];
  onClose: () => void;
  onSaved: (r: HealthRecord) => void;
};

export function HealthRecordModal({ open, record, preset, people, onClose, onSaved }: Props) {
  const [subject, setSubject] = useState<HealthSubject>("student");
  const [personId, setPersonId] = useState("");
  const [category, setCategory] = useState<HealthRecordCategory>("hygiene_check");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [frequency, setFrequency] = useState<HealthFrequency>("monthly");
  const [outcome, setOutcome] = useState<HealthOutcome>("clear");
  const [specifics, setSpecifics] = useState("");
  const [details, setDetails] = useState("");
  const [conductedBy, setConductedBy] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [parentNotified, setParentNotified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = HEALTH_CATEGORIES.filter((c) => c.subjects.includes(subject));
  const personOptions = useMemo(() => people.filter((p) => p.subject === subject), [people, subject]);

  const defaultTitle = (cat: HealthRecordCategory, d: string) => {
    const label = HEALTH_CATEGORIES.find((c) => c.value === cat)?.label ?? "";
    if (cat === "hygiene_check" && d) {
      return `${new Date(d + "T12:00:00").toLocaleString("en-US", { month: "long", year: "numeric" })} hygiene check`;
    }
    return label;
  };

  useEffect(() => {
    if (!open) return;
    const subj = record?.subject ?? preset?.subject ?? "student";
    const cat = record?.category ?? preset?.category ?? "hygiene_check";
    const freq = record?.frequency ?? HEALTH_CATEGORIES.find((c) => c.value === cat)?.defaultFrequency ?? "one_time";
    const d = record?.date ?? todayIso();
    setSubject(subj);
    setPersonId(record?.personId ?? preset?.personId ?? "");
    setCategory(cat);
    setTitle(record?.title ?? defaultTitle(cat, d));
    setDate(d);
    setFrequency(freq);
    setOutcome(record?.outcome ?? "clear");
    setSpecifics(record?.specifics ?? "");
    setDetails(record?.details ?? "");
    setConductedBy(record?.conductedBy ?? "");
    setFollowUpRequired(record?.followUpRequired ?? false);
    setFollowUpDate(record?.followUpDate ?? "");
    setNextDueDate(record?.nextDueDate ?? nextDueFor(d, freq) ?? "");
    setParentNotified(record?.parentNotified ?? false);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record, preset]);

  const changeCategory = (cat: HealthRecordCategory) => {
    setCategory(cat);
    const freq = HEALTH_CATEGORIES.find((c) => c.value === cat)?.defaultFrequency ?? "one_time";
    setFrequency(freq);
    setNextDueDate(nextDueFor(date, freq) ?? "");
    if (!record) setTitle(defaultTitle(cat, date));
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    const person = people.find((p) => p.id === personId && p.subject === subject);
    if (!person) next.personId = `Select a ${subject}`;
    if (title.trim().length < 3) next.title = "Title required";
    if (!date) next.date = "Date required";
    if (followUpRequired && !followUpDate) next.followUpDate = "Follow-up date required";
    setErrors(next);
    if (Object.keys(next).length || !person) return;

    const saved = await saveHealthRecord({
      id: record?.id,
      subject,
      personId: person.id,
      personName: person.name,
      branchId: person.branchId,
      category,
      title: title.trim(),
      date,
      frequency,
      outcome,
      specifics: specifics.trim() || undefined,
      details: details.trim() || undefined,
      conductedBy: conductedBy.trim() || undefined,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : undefined,
      followUpDone: followUpRequired ? record?.followUpDone ?? false : undefined,
      nextDueDate: nextDueDate || undefined,
      parentNotified: subject === "student" ? parentNotified : undefined,
      parentNotifiedAt:
        subject === "student" && parentNotified ? record?.parentNotifiedAt ?? new Date().toISOString() : undefined,
      campaignId: record?.campaignId,
    });
    onSaved({ ...saved });
    toast.success(record ? "Health record updated" : "Health record saved");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <HeartPulse className="h-5 w-5 text-brand-500" />
            {record ? "Edit health record" : "New health & safety record"}
          </h2>
          {record ? (
            <LastUpdated stamp={record.lastUpdated} className="mt-1" />
          ) : (
            <p className="mt-1 text-sm text-muted">Hygiene checks, health checks, vaccinations, tests and medical information.</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Record for</Label>
            <select
              className={selectClass}
              value={subject}
              disabled={!!record}
              onChange={(e) => {
                const s = e.target.value as HealthSubject;
                setSubject(s);
                setPersonId("");
                const first = HEALTH_CATEGORIES.find((c) => c.subjects.includes(s))!.value;
                changeCategory(first);
              }}
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <Label>{subject === "student" ? "Student" : "Staff member"}</Label>
            <select className={selectClass} value={personId} disabled={!!record} onChange={(e) => setPersonId(e.target.value)}>
              <option value="">Select…</option>
              {personOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.detail ? ` · ${p.detail}` : ""}
                </option>
              ))}
            </select>
            {errors.personId && <p className="mt-1 text-xs text-danger">{errors.personId}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <select className={selectClass} value={category} onChange={(e) => changeCategory(e.target.value as HealthRecordCategory)}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Frequency</Label>
            <select
              className={selectClass}
              value={frequency}
              onChange={(e) => {
                const f = e.target.value as HealthFrequency;
                setFrequency(f);
                setNextDueDate(nextDueFor(date, f) ?? nextDueDate);
              }}
            >
              {(Object.keys(HEALTH_FREQUENCY_LABEL) as HealthFrequency[]).map((f) => (
                <option key={f} value={f}>{HEALTH_FREQUENCY_LABEL[f]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="htitle">Title</Label>
            <Input id="htitle" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="hdate">Date</Label>
            <Input
              id="hdate"
              type="date"
              className="mt-1"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setNextDueDate(nextDueFor(e.target.value, frequency) ?? nextDueDate);
              }}
            />
            {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
          </div>
          <div>
            <Label>Outcome / result</Label>
            <select className={selectClass} value={outcome} onChange={(e) => setOutcome(e.target.value as HealthOutcome)}>
              {(Object.keys(HEALTH_OUTCOME_LABEL) as HealthOutcome[]).map((o) => (
                <option key={o} value={o}>{HEALTH_OUTCOME_LABEL[o]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="hspec">Vaccine / test / medicine & dose</Label>
            <Input id="hspec" className="mt-1" value={specifics} onChange={(e) => setSpecifics(e.target.value)} placeholder="e.g. OPV 2 drops · Anti-HCV · 5 ml at 12 PM" />
          </div>
          <div>
            <Label htmlFor="hby">Conducted by</Label>
            <Input id="hby" className="mt-1" value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="hdetails">Details / observations</Label>
            <Textarea id="hdetails" rows={2} className="mt-1" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="hnext">Next due / renewal date</Label>
            <Input id="hnext" type="date" className="mt-1" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-bg px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-heading">Follow-up required</p>
              <Switch checked={followUpRequired} onCheckedChange={setFollowUpRequired} />
            </div>
            {followUpRequired && (
              <div className="mt-2">
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} aria-label="Follow-up date" />
                {errors.followUpDate && <p className="mt-1 text-xs text-danger">{errors.followUpDate}</p>}
              </div>
            )}
          </div>
          {subject === "student" && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-heading">Parent notified</p>
                <p className="text-[11px] text-muted">Mark once parents have been informed</p>
              </div>
              <Switch checked={parentNotified} onCheckedChange={setParentNotified} />
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>{record ? "Save changes" : "Save record"}</Button>
      </div>
    </ModalPortal>
  );
}
