"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarClock, CheckCircle2, ClipboardCheck, Pencil, Plus, Syringe } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LastUpdated } from "@/components/common/LastUpdated";
import { FilterInput, FilterSelect, RangeFilter } from "@/components/common/FilterControls";
import { HealthRecordModal, type HealthPerson } from "@/components/health/HealthRecordModal";
import { VaccinationCampaignModal } from "@/components/health/VaccinationCampaignModal";
import { OUTCOME_TONE } from "@/components/health/HealthRecordList";
import { branches } from "@/data/branches";
import {
  HEALTH_CATEGORIES,
  HEALTH_CATEGORY_LABEL,
  HEALTH_FREQUENCY_LABEL,
  HEALTH_OUTCOME_LABEL,
} from "@/data/health-safety";
import { updateHealthRecord } from "@/lib/mock-service";
import { addDaysIso, todayIso } from "@/lib/fee-challan";
import { cn, formatDate } from "@/lib/utils";
import type {
  HealthFrequency,
  HealthOutcome,
  HealthRecord,
  HealthRecordCategory,
  HealthSubject,
  VaccinationCampaign,
} from "@/types";

const branchName = (id: string) => branches.find((b) => b.id === id)?.name.replace(" Campus", "") ?? id;

type Props = {
  records: HealthRecord[];
  campaigns: VaccinationCampaign[];
  people: HealthPerson[];
};

export function HealthSafetyHub({ records: initialRecords, campaigns: initialCampaigns, people }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [modal, setModal] = useState<{ record?: HealthRecord; preset?: Partial<HealthRecord> } | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  const today = todayIso();
  const month = today.slice(0, 7);
  const soon = addDaysIso(today, 30);

  const upsert = (r: HealthRecord) =>
    setRecords((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev]));

  const patch = async (r: HealthRecord, p: Partial<HealthRecord>, msg: string) => {
    const updated = await updateHealthRecord(r.id, p);
    if (updated) {
      upsert({ ...updated });
      toast.success(msg);
    }
  };

  // ── Overview derivations ──
  const hygieneThisMonth = (subject: HealthSubject) => {
    const checked = new Set(
      records.filter((r) => r.subject === subject && r.category === "hygiene_check" && r.date.startsWith(month)).map((r) => r.personId)
    );
    const all = people.filter((p) => p.subject === subject);
    return { checked: all.filter((p) => checked.has(p.id)).length, total: all.length, pending: all.filter((p) => !checked.has(p.id)) };
  };
  const studentHygiene = hygieneThisMonth("student");
  const staffHygiene = hygieneThisMonth("staff");

  /** Latest record per person+category whose next due / renewal date is past or within 30 days */
  const dueSoon = useMemo(() => {
    const latest = new Map<string, HealthRecord>();
    for (const r of records) {
      const k = `${r.subject}:${r.personId}:${r.category}`;
      const cur = latest.get(k);
      if (!cur || cur.date < r.date) latest.set(k, r);
    }
    return Array.from(latest.values())
      .filter((r) => r.nextDueDate && r.nextDueDate <= soon && r.category !== "hygiene_check")
      .sort((a, b) => (a.nextDueDate! < b.nextDueDate! ? -1 : 1));
  }, [records, soon]);

  const openFollowUps = records
    .filter((r) => r.followUpRequired && !r.followUpDone)
    .sort((a, b) => ((a.followUpDate ?? "") < (b.followUpDate ?? "") ? -1 : 1));

  const notifyPending = records.filter(
    (r) =>
      r.subject === "student" &&
      !r.parentNotified &&
      (r.outcome === "attention" || r.outcome === "referred" || r.category === "health_incident" || r.category === "medication" || r.followUpRequired)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setCampaignOpen(true)}>
          <Syringe className="h-4 w-4" /> Record campaign
        </Button>
        <Button type="button" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" /> New record
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="student">Student health & safety</TabsTrigger>
          <TabsTrigger value="staff">Staff health & safety</TabsTrigger>
          <TabsTrigger value="campaigns">Vaccination campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={ClipboardCheck}
              label={`Student hygiene · ${formatDate(today, "MMMM")}`}
              value={`${studentHygiene.checked} / ${studentHygiene.total}`}
              hint={`${studentHygiene.pending.length} not yet checked`}
            />
            <Kpi
              icon={ClipboardCheck}
              label={`Staff hygiene · ${formatDate(today, "MMMM")}`}
              value={`${staffHygiene.checked} / ${staffHygiene.total}`}
              hint={`${staffHygiene.pending.length} not yet checked`}
            />
            <Kpi icon={CalendarClock} label="Checks / renewals due (30 days)" value={String(dueSoon.length)} hint="Bi-annual checks, tests, certificates" />
            <Kpi icon={BellRing} label="Open follow-ups" value={String(openFollowUps.length)} hint={`${notifyPending.length} parent notification(s) pending`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Due & overdue</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {dueSoon.length === 0 && <p className="text-sm text-muted">Nothing due in the next 30 days.</p>}
                {dueSoon.map((r) => {
                  const overdue = r.nextDueDate! < today;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-heading">
                          {r.personName} <span className="text-xs font-normal capitalize text-muted">· {r.subject}</span>
                        </p>
                        <p className="text-xs text-muted">
                          {HEALTH_CATEGORY_LABEL[r.category]} · last {formatDate(r.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={cn("text-xs font-semibold", overdue ? "text-danger" : "text-[#B76E00]")}>
                          {overdue ? "Overdue" : "Due"} {formatDate(r.nextDueDate!)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setModal({ preset: { subject: r.subject, personId: r.personId, category: r.category } })}
                        >
                          Record
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Open follow-ups</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {openFollowUps.length === 0 && <p className="text-sm text-muted">No open follow-ups.</p>}
                {openFollowUps.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-heading">{r.personName} · {r.title}</p>
                      <p className="text-xs text-muted">
                        Follow-up {r.followUpDate ? formatDate(r.followUpDate) : "—"}
                        {r.subject === "student" && (r.parentNotified ? " · parent notified" : " · parent not notified")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {r.subject === "student" && !r.parentNotified && (
                        <Button type="button" size="sm" variant="outline" onClick={() => patch(r, { parentNotified: true, parentNotifiedAt: new Date().toISOString() }, "Parent notified")}>
                          Notify
                        </Button>
                      )}
                      <Button type="button" size="sm" onClick={() => patch(r, { followUpDone: true }, "Follow-up closed")}>
                        Done
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Monthly hygiene check — not yet done this month</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ["Students", studentHygiene.pending, "student"],
                    ["Staff", staffHygiene.pending, "staff"],
                  ] as const
                ).map(([label, list, subject]) => (
                  <div key={label}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                    {list.length === 0 ? (
                      <p className="text-sm text-brand-700">All checked ✓</p>
                    ) : (
                      <ul className="space-y-1">
                        {list.map((p) => (
                          <li key={p.id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-bg">
                            <span className="text-heading">
                              {p.name} <span className="text-xs text-muted">· {branchName(p.branchId)}</span>
                            </span>
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-600"
                              onClick={() => setModal({ preset: { subject, personId: p.id, category: "hygiene_check" } })}
                            >
                              Record check
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {(["student", "staff"] as const).map((subject) => (
          <TabsContent key={subject} value={subject} className="mt-4">
            <RecordsTable
              subject={subject}
              records={records.filter((r) => r.subject === subject)}
              onEdit={(r) => setModal({ record: r })}
              onFollowUpDone={(r) => patch(r, { followUpDone: true }, "Follow-up closed")}
              onNotify={(r) => patch(r, { parentNotified: true, parentNotifiedAt: new Date().toISOString() }, "Parent notified")}
            />
          </TabsContent>
        ))}

        <TabsContent value="campaigns" className="mt-4">
          <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-bg">
                <tr>
                  {["Campaign", "Vaccine", "Date", "Audience", "Branches", "Covered", "Conducted by", "Last updated"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-heading">{c.name}</p>
                      {c.notes && <p className="text-[11px] text-muted">{c.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{c.vaccine}</td>
                    <td className="px-4 py-3">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 capitalize">{c.audience === "both" ? "Students & staff" : c.audience}</td>
                    <td className="px-4 py-3 text-muted">{c.branchIds.map(branchName).join(", ")}</td>
                    <td className="px-4 py-3 font-semibold">{c.coveredCount}</td>
                    <td className="px-4 py-3 text-muted">{c.conductedBy}</td>
                    <td className="px-4 py-3"><LastUpdated stamp={c.lastUpdated} variant="compact" /></td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">No campaigns recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <HealthRecordModal
        open={!!modal}
        record={modal?.record}
        preset={modal?.preset}
        people={people}
        onClose={() => setModal(null)}
        onSaved={upsert}
      />
      <VaccinationCampaignModal
        open={campaignOpen}
        people={people}
        onClose={() => setCampaignOpen(false)}
        onSaved={(c, rs) => {
          setCampaigns((prev) => [c, ...prev]);
          setRecords((prev) => [...rs, ...prev]);
        }}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof BellRing; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <Icon className="h-3.5 w-3.5" /> {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-bold text-heading">{value}</p>
        {hint && <p className="text-[11px] text-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function RecordsTable({
  subject,
  records,
  onEdit,
  onFollowUpDone,
  onNotify,
}: {
  subject: HealthSubject;
  records: HealthRecord[];
  onEdit: (r: HealthRecord) => void;
  onFollowUpDone: (r: HealthRecord) => void;
  onNotify: (r: HealthRecord) => void;
}) {
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState<HealthRecordCategory | "all">("all");
  const [frequency, setFrequency] = useState<HealthFrequency | "all">("all");
  const [outcome, setOutcome] = useState<HealthOutcome | "all">("all");
  const [followUp, setFollowUp] = useState<"open" | "none" | "all">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = records
    .filter((r) => {
      if (branch !== "all" && r.branchId !== branch) return false;
      if (category !== "all" && r.category !== category) return false;
      if (frequency !== "all" && r.frequency !== frequency) return false;
      if (outcome !== "all" && r.outcome !== outcome) return false;
      if (followUp === "open" && !(r.followUpRequired && !r.followUpDone)) return false;
      if (followUp === "none" && r.followUpRequired && !r.followUpDone) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      const q = search.trim().toLowerCase();
      return !q || r.personName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterInput label={subject === "student" ? "Student" : "Staff member"} placeholder="Name or title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FilterSelect label="Branch" value={branch} onChange={setBranch} allLabel="All branches" options={branches.map((b) => ({ value: b.id, label: branchName(b.id) }))} />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={HEALTH_CATEGORIES.filter((c) => c.subjects.includes(subject)).map((c) => ({ value: c.value, label: c.label }))}
        />
        <FilterSelect
          label="Frequency"
          value={frequency}
          onChange={setFrequency}
          options={(Object.keys(HEALTH_FREQUENCY_LABEL) as HealthFrequency[]).map((f) => ({ value: f, label: HEALTH_FREQUENCY_LABEL[f] }))}
        />
        <FilterSelect
          label="Outcome"
          value={outcome}
          onChange={setOutcome}
          options={(Object.keys(HEALTH_OUTCOME_LABEL) as HealthOutcome[]).map((o) => ({ value: o, label: HEALTH_OUTCOME_LABEL[o] }))}
        />
        <FilterSelect
          label="Follow-up"
          value={followUp}
          onChange={setFollowUp}
          options={[
            { value: "open", label: "Follow-up pending" },
            { value: "none", label: "No open follow-up" },
          ]}
        />
        <RangeFilter label="Date" type="date" from={from} to={to} onFrom={setFrom} onTo={setTo} className="lg:col-span-2" />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[1150px] text-sm">
          <thead className="border-b border-border bg-bg">
            <tr>
              {[subject === "student" ? "Student" : "Staff", "Category / record", "Date", "Frequency", "Outcome", "Follow-up", "Next due", ...(subject === "student" ? ["Parent"] : []), "Last updated", ""].map(
                (h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const openFu = r.followUpRequired && !r.followUpDone;
              return (
                <tr key={r.id} className="border-b border-border align-top last:border-0 hover:bg-bg">
                  <td className="px-3 py-3">
                    {subject === "student" ? (
                      <Link href={`/students/${r.personId}`} className="font-medium text-brand-600 hover:underline">{r.personName}</Link>
                    ) : (
                      <Link href={`/hr/staff/${r.personId}`} className="font-medium text-brand-600 hover:underline">{r.personName}</Link>
                    )}
                    <p className="text-[11px] text-muted">{branchName(r.branchId)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-semibold text-brand-600">{HEALTH_CATEGORY_LABEL[r.category]}</p>
                    <p className="text-heading">{r.title}</p>
                    {r.specifics && <p className="text-[11px] text-muted">{r.specifics}</p>}
                    {r.details && <p className="max-w-xs text-[11px] text-muted">{r.details}</p>}
                  </td>
                  <td className="px-3 py-3">{formatDate(r.date)}</td>
                  <td className="px-3 py-3 text-muted">{HEALTH_FREQUENCY_LABEL[r.frequency]}</td>
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", OUTCOME_TONE[r.outcome])}>
                      {HEALTH_OUTCOME_LABEL[r.outcome]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {openFu ? (
                      <span className="text-xs font-semibold text-[#B76E00]">Due {r.followUpDate ? formatDate(r.followUpDate) : "—"}</span>
                    ) : r.followUpRequired ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">{r.nextDueDate ? formatDate(r.nextDueDate) : <span className="text-muted">—</span>}</td>
                  {subject === "student" && (
                    <td className="px-3 py-3">
                      {r.parentNotified ? (
                        <Badge variant="success">Notified</Badge>
                      ) : (
                        <button type="button" onClick={() => onNotify(r)} className="text-xs font-semibold text-brand-600 hover:underline">
                          Notify parent
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3"><LastUpdated stamp={r.lastUpdated} variant="compact" /></td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {openFu && (
                        <Button type="button" size="sm" variant="outline" onClick={() => onFollowUpDone(r)}>
                          Close follow-up
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(r)} aria-label="Edit record">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={subject === "student" ? 10 : 9} className="px-3 py-8 text-center text-sm text-muted">
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
