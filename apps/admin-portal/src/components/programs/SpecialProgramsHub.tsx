"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FileText, Pencil, Plus, UserPlus, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LastUpdated } from "@/components/common/LastUpdated";
import { FilterInput, FilterSelect } from "@/components/common/FilterControls";
import { PaymentVoucherModal, type PaymentVoucherData } from "@/components/billing/PaymentVoucher";
import { ProgramFormModal, PROGRAM_STATUS_LABEL } from "@/components/programs/ProgramFormModal";
import { ProgramRegistrationModal } from "@/components/programs/ProgramRegistrationModal";
import { ProgramPaymentModal, PAYMENT_MODE_LABEL } from "@/components/programs/ProgramPaymentModal";
import { branches } from "@/data/branches";
import { PROGRAM_CATEGORIES } from "@/data/special-programs";
import { issueProgramVoucher } from "@/lib/mock-service";
import { calculateAge, cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  Parent,
  ProgramCategory,
  ProgramPaymentStatus,
  ProgramRegistration,
  ProgramStatus,
  SpecialProgram,
  Student,
} from "@/types";

const CATEGORY_LABEL = Object.fromEntries(PROGRAM_CATEGORIES.map((c) => [c.value, c.label])) as Record<
  ProgramCategory,
  string
>;

const STATUS_BADGE: Record<ProgramStatus, "success" | "info" | "secondary" | "default" | "danger"> = {
  open: "success",
  planned: "info",
  closed: "secondary",
  completed: "default",
  cancelled: "danger",
};

const PAYMENT_LABEL: Record<ProgramPaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
  waived: "Waived",
  not_applicable: "Free",
};

const PAYMENT_TONE: Record<ProgramPaymentStatus, string> = {
  unpaid: "bg-soft-red text-danger",
  partial: "bg-soft-yellow text-[#B76E00]",
  paid: "bg-soft-green text-brand-700",
  waived: "bg-soft-blue text-[#4C8BF5]",
  not_applicable: "bg-bg text-muted",
};

const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

type Props = {
  programs: SpecialProgram[];
  registrations: ProgramRegistration[];
  students: Student[];
  parents: Parent[];
};

export function SpecialProgramsHub({ programs: initialPrograms, registrations: initialRegs, students, parents }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [registrations, setRegistrations] = useState(initialRegs);
  const [category, setCategory] = useState<ProgramCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(initialPrograms.find((p) => p.status === "open")?.id ?? initialPrograms[0]?.id ?? "");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialProgram | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [paying, setPaying] = useState<ProgramRegistration | null>(null);
  const [voucher, setVoucher] = useState<PaymentVoucherData | null>(null);

  const [participant, setParticipant] = useState<"enrolled" | "external" | "all">("all");
  const [payment, setPayment] = useState<ProgramPaymentStatus | "all">("all");
  const [search, setSearch] = useState("");

  const visiblePrograms = useMemo(
    () =>
      programs
        .filter((p) => category === "all" || p.category === category)
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [programs, category]
  );
  const selected = programs.find((p) => p.id === selectedId) ?? visiblePrograms[0];

  const regsFor = (id: string) => registrations.filter((r) => r.programId === id);
  const programRegs = selected ? regsFor(selected.id) : [];
  const rows = programRegs.filter((r) => {
    if (participant !== "all" && r.participantType !== participant) return false;
    if (payment !== "all" && r.paymentStatus !== payment) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.studentName, r.parentName, r.grNumber, r.registrationNo, r.parentContact]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q));
  });

  const totals = {
    enrolled: programRegs.filter((r) => r.participantType === "enrolled").length,
    external: programRegs.filter((r) => r.participantType === "external").length,
    billed: programRegs.filter((r) => r.paymentStatus !== "waived").reduce((s, r) => s + r.amount, 0),
    collected: programRegs.reduce((s, r) => s + r.amountPaid, 0),
  };

  const upsertReg = (r: ProgramRegistration) =>
    setRegistrations((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev]));

  const openVoucher = (r: ProgramRegistration) => {
    if (!selected || !r.voucherNumber || !r.voucherIssuedAt || !r.voucherDueDate) return;
    setVoucher({
      title: `${CATEGORY_LABEL[selected.category]} Voucher`,
      voucherNumber: r.voucherNumber,
      issueDate: r.voucherIssuedAt,
      dueDate: r.voucherDueDate,
      branchName: branchName(selected.branchId),
      payer: {
        name: r.studentName,
        idLabel: r.grNumber ? "G.R. No." : "Reg. No.",
        idValue: r.grNumber ?? r.registrationNo,
        parentName: r.parentName,
        contact: r.parentContact,
        context: selected.name,
      },
      lines: [
        {
          label: `${selected.name} (${formatDate(selected.startDate, "d MMM")} – ${formatDate(selected.endDate, "d MMM yyyy")})`,
          amount: r.amount,
        },
      ],
      paid: r.amountPaid,
    });
  };

  const generateVoucher = async (r: ProgramRegistration) => {
    const updated = await issueProgramVoucher(r.id);
    if (!updated) {
      toast.error("No fee on this registration — nothing to voucher.");
      return;
    }
    upsertReg({ ...updated });
    toast.success(`Voucher ${updated.voucherNumber} generated`);
  };

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[{ value: "all" as const, label: "All programs" }, ...PROGRAM_CATEGORIES].map((c) => {
          const count = c.value === "all" ? programs.length : programs.filter((p) => p.category === c.value).length;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                category === c.value ? "bg-brand-500 text-white" : "bg-bg text-muted hover:text-heading"
              )}
            >
              {c.label} <span className="opacity-70">· {count}</span>
            </button>
          );
        })}
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New program
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* Program list */}
        <div className="space-y-2">
          {visiblePrograms.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              No programs in this category yet.
            </p>
          )}
          {visiblePrograms.map((p) => {
            const regs = regsFor(p.id).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full rounded-2xl border bg-surface p-3.5 text-left transition hover:border-brand-300",
                  selected?.id === p.id ? "border-brand-400 ring-1 ring-brand-200" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-heading">{p.name}</p>
                  <Badge variant={STATUS_BADGE[p.status]}>{PROGRAM_STATUS_LABEL[p.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {CATEGORY_LABEL[p.category]} · {branchName(p.branchId).replace(" Campus", "")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(p.startDate, "d MMM")}
                  {p.endDate !== p.startDate && ` – ${formatDate(p.endDate, "d MMM yyyy")}`}
                  {p.endDate === p.startDate && ` ${formatDate(p.startDate, "yyyy")}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-muted">
                  <span className="font-semibold text-heading">{p.fee > 0 ? formatCurrency(p.fee) : "Free"}</span>
                  {p.fee > 0 && <span>{p.voucherRequired ? "Voucher" : "Payment record only"}</span>}
                  <span>
                    {regs}
                    {p.capacity ? ` / ${p.capacity}` : ""} registered
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected program */}
        {selected ? (
          <div className="min-w-0 space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{CATEGORY_LABEL[selected.category]}</p>
                    <h2 className="font-heading text-xl font-bold text-heading">{selected.name}</h2>
                    {selected.description && <p className="mt-1 text-sm text-muted">{selected.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(selected);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={selected.status !== "open" && selected.status !== "planned"}
                      onClick={() => setRegisterOpen(true)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Register child
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
                  </span>
                  <span>{branchName(selected.branchId)}</span>
                  {selected.ageGroup && <span>Ages {selected.ageGroup}</span>}
                  <span>{selected.openToExternal ? "Open to outside children" : "Enrolled students only"}</span>
                  <span>
                    {selected.fee > 0
                      ? `${formatCurrency(selected.fee)} · ${selected.voucherRequired ? `voucher due in ${selected.voucherDueDays} days` : "amount / payment record (no voucher)"}`
                      : "Free"}
                  </span>
                </div>
                <LastUpdated stamp={selected.lastUpdated} />
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-4">
              <Stat icon={Users} label="SDLC students" value={String(totals.enrolled)} />
              <Stat icon={Users} label="Outside children" value={String(totals.external)} />
              <Stat icon={FileText} label="Total billed" value={formatCurrency(totals.billed)} />
              <Stat
                icon={Wallet}
                label="Collected"
                value={formatCurrency(totals.collected)}
                hint={totals.billed - totals.collected > 0 ? `${formatCurrency(totals.billed - totals.collected)} outstanding` : undefined}
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
              <FilterInput label="Search" placeholder="Child, parent, GR / reg no." value={search} onChange={(e) => setSearch(e.target.value)} />
              <FilterSelect
                label="Participant"
                value={participant}
                onChange={setParticipant}
                options={[
                  { value: "enrolled", label: "SDLC students" },
                  { value: "external", label: "Outside children" },
                ]}
              />
              <FilterSelect
                label="Payment"
                value={payment}
                onChange={setPayment}
                options={(Object.keys(PAYMENT_LABEL) as ProgramPaymentStatus[]).map((k) => ({ value: k, label: PAYMENT_LABEL[k] }))}
              />
            </div>

            <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
              <table className="w-full min-w-[1150px] text-sm">
                <thead className="border-b border-border bg-bg">
                  <tr>
                    {["Student", "G.R. / Reg. No.", "Parent & contact", "DOB / Age", "Registered", "Amount", "Payment", "Voucher", "Last updated", ""].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border align-top last:border-0 hover:bg-bg">
                      <td className="px-3 py-3">
                        <p className="font-medium text-heading">{r.studentName}</p>
                        <p className="text-[11px] text-muted">
                          {r.participantType === "enrolled" ? "SDLC student" : `Outside child${r.externalSchool ? ` · ${r.externalSchool}` : ""}`}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs font-semibold text-heading">{r.grNumber ?? "—"}</p>
                        <p className="font-mono text-[11px] text-muted">{r.registrationNo}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-heading">{r.parentName}</p>
                        <p className="text-[11px] text-muted">{r.parentContact}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{formatDate(r.dob)}</p>
                        <p className="text-[11px] text-muted">{calculateAge(r.dob)} yrs</p>
                      </td>
                      <td className="px-3 py-3">{formatDate(r.registrationDate)}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-heading">{r.amount > 0 ? formatCurrency(r.amount) : "—"}</p>
                        {r.amountPaid > 0 && r.amountPaid < r.amount && (
                          <p className="text-[11px] text-muted">Paid {formatCurrency(r.amountPaid)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", PAYMENT_TONE[r.paymentStatus])}>
                          {PAYMENT_LABEL[r.paymentStatus]}
                        </span>
                        {r.paidAt && (
                          <p className="mt-1 text-[11px] text-muted">
                            {r.paymentMode ? PAYMENT_MODE_LABEL[r.paymentMode] : ""} · {formatDate(r.paidAt)}
                            {r.receiptNo ? ` · ${r.receiptNo}` : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.voucherNumber ? (
                          <>
                            <button type="button" onClick={() => openVoucher(r)} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                              {r.voucherNumber}
                            </button>
                            {r.voucherDueDate && <p className="text-[11px] text-muted">Due {formatDate(r.voucherDueDate)}</p>}
                          </>
                        ) : r.amount > 0 ? (
                          <button type="button" onClick={() => generateVoucher(r)} className="text-xs font-semibold text-brand-600 hover:underline">
                            Generate voucher
                          </button>
                        ) : (
                          <span className="text-xs text-muted">Not required</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <LastUpdated stamp={r.lastUpdated} variant="compact" />
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.amount > 0 && (r.paymentStatus === "unpaid" || r.paymentStatus === "partial") && (
                          <Button type="button" size="sm" variant="outline" onClick={() => setPaying(r)}>
                            <Wallet className="h-3.5 w-3.5" />
                            Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted">
                        {programRegs.length === 0 ? "No registrations yet." : "No registrations match these filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Create a program to start registrations.</p>
        )}
      </div>

      <ProgramFormModal
        open={formOpen}
        program={editing}
        defaultCategory={category === "all" ? undefined : category}
        onClose={() => setFormOpen(false)}
        onSaved={(p) => {
          setPrograms((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]));
          setSelectedId(p.id);
        }}
      />
      {selected && (
        <ProgramRegistrationModal
          open={registerOpen}
          program={selected}
          students={students}
          parents={parents}
          onClose={() => setRegisterOpen(false)}
          onRegistered={upsertReg}
        />
      )}
      <ProgramPaymentModal registration={paying} onClose={() => setPaying(null)} onSaved={upsertReg} />
      <PaymentVoucherModal voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </p>
        <p className="mt-1 font-heading text-xl font-bold text-heading">{value}</p>
        {hint && <p className="text-[11px] text-danger">{hint}</p>}
      </CardContent>
    </Card>
  );
}
