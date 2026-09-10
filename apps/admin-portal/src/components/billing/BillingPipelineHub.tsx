"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "structure", n: 1, title: "Fee Structure", desc: "Class / student-wise fee components" },
  { id: "generation", n: 2, title: "Fee Generation", desc: "Generate monthly fees from approved structure" },
  { id: "custom", n: 3, title: "Custom Fee", desc: "Additional or special charges" },
  { id: "vouchers", n: 4, title: "Fee Vouchers", desc: "Bulk / single voucher issuance", href: "/billing/create" },
  { id: "collection", n: 5, title: "Fee Collection", desc: "Bank / online / approved channels", href: "/billing" },
  { id: "daily", n: 6, title: "Daily Collection", desc: "Record and verify same-day receipts" },
  { id: "correction", n: 7, title: "Fee Correction", desc: "Correct verified fee record errors" },
  { id: "update", n: 8, title: "Fee Update", desc: "Adjustments, discounts, status changes" },
  { id: "fine", n: 9, title: "Monthly Fine", desc: "Late-payment fines on overdue vouchers" },
  { id: "reconciliation", n: 10, title: "Reconciliation", desc: "Match bank / KuickPay receipts" },
  { id: "statistics", n: 11, title: "Statistics", desc: "Collection, outstanding, paid/unpaid" },
  { id: "reports", n: 12, title: "Data Reports", desc: "Branch · Accounts · HO MIS exports", href: "/reports" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const STRUCTURE_ROWS = [
  { className: "Infant", admission: 45000, monthly: 28000, extras: "Meals optional" },
  { className: "Playgroup", admission: 45000, monthly: 25000, extras: "—" },
  { className: "Nursery", admission: 45000, monthly: 22000, extras: "Books pack" },
  { className: "Kindergarten", admission: 45000, monthly: 24000, extras: "Uniform" },
];

const DAILY_ROWS = [
  { time: "09:12", student: "Hamdan Khan", channel: "KuickPay", amount: 45000, ref: "KP-8821" },
  { time: "11:40", student: "Zainab Siddiqui", channel: "Bank Al Habib", amount: 28000, ref: "BAH-4412" },
  { time: "14:05", student: "Ayaan Malik", channel: "Cash (branch)", amount: 5000, ref: "CASH-019" },
];

const RECON_ROWS = [
  { ref: "KP-8821", system: 45000, bank: 45000, status: "matched" as const },
  { ref: "BAH-4412", system: 28000, bank: 28000, status: "matched" as const },
  { ref: "KP-9001", system: 32000, bank: 0, status: "missing_bank" as const },
  { ref: "BAH-4500", system: 0, bank: 15000, status: "missing_system" as const },
];

type Props = { activeStep?: string };

export function BillingPipelineHub({ activeStep }: Props) {
  const initial = (STEPS.find((s) => s.id === activeStep)?.id ?? "structure") as StepId;
  const [step, setStep] = useState<StepId>(initial);
  const [month, setMonth] = useState("2026-09");
  const [customCharge, setCustomCharge] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [fineRate, setFineRate] = useState("5");

  const meta = useMemo(() => STEPS.find((s) => s.id === step)!, [step]);

  const runDemo = (msg: string) => toast.success(msg);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Head Office billing pipeline. Steps with a link open live screens; others run interactive demo actions.
      </p>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "flex h-full w-full flex-col rounded-2xl border bg-surface p-3 text-left shadow-card transition hover:border-brand-200",
                step === s.id ? "border-brand-500 ring-1 ring-brand-200" : "border-border"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-600">Step {s.n}</span>
                {s.n <= 5 && <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />}
              </div>
              <p className="text-sm font-semibold text-heading">{s.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">{s.desc}</p>
            </button>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-heading">
              Step {meta.n}: {meta.title}
            </h2>
            <p className="text-sm text-muted">{meta.desc}</p>
          </div>
          {"href" in meta && meta.href && (
            <Button asChild variant="outline">
              <Link href={meta.href}>Open live screen</Link>
            </Button>
          )}
        </div>

        {step === "structure" && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-bg text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Class</th>
                    <th className="px-3 py-2 text-right">Admission</th>
                    <th className="px-3 py-2 text-right">Monthly</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {STRUCTURE_ROWS.map((r) => (
                    <tr key={r.className} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-heading">{r.className}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(r.admission)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(r.monthly)}</td>
                      <td className="px-3 py-2 text-muted">{r.extras}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" onClick={() => runDemo("Fee structure saved for session (demo)")}>
              <Play className="h-4 w-4" /> Save structure
            </Button>
          </div>
        )}

        {step === "generation" && (
          <div className="space-y-3">
            <div className="max-w-xs">
              <Label htmlFor="bill-month">Billing month</Label>
              <Input id="bill-month" type="month" className="mt-1" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <p className="text-sm text-muted">Will generate monthly fees for all active students on approved structure.</p>
            <Button type="button" onClick={() => runDemo(`Generated monthly fees for ${month} · 128 students (demo)`)}>
              Generate monthly fees
            </Button>
          </div>
        )}

        {step === "custom" && (
          <div className="grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Charge description</Label>
              <Input className="mt-1" value={customCharge} onChange={(e) => setCustomCharge(e.target.value)} placeholder="e.g. Field trip Sep" />
            </div>
            <div>
              <Label>Amount (PKR)</Label>
              <Input className="mt-1" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="5000" />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full"
                onClick={() => runDemo(`Custom fee “${customCharge || "Charge"}” · ${customAmount || "0"} queued (demo)`)}
              >
                Add custom fee
              </Button>
            </div>
          </div>
        )}

        {(step === "vouchers" || step === "collection" || step === "reports") && (
          <p className="text-sm text-muted">
            Use <strong>Open live screen</strong> for the production voucher / collection / analytics UI already in the ERP.
          </p>
        )}

        {step === "daily" && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-bg text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {DAILY_ROWS.map((r) => (
                    <tr key={r.ref} className="border-t border-border">
                      <td className="px-3 py-2">{r.time}</td>
                      <td className="px-3 py-2 font-medium text-heading">{r.student}</td>
                      <td className="px-3 py-2 text-muted">{r.channel}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(r.amount)}</td>
                      <td className="px-3 py-2 text-muted">{r.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" onClick={() => runDemo("Daily collection verified · PKR 78,000 (demo)")}>
              Verify today’s receipts
            </Button>
          </div>
        )}

        {step === "correction" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Correct genuine errors after verification (amount, GR, challan period).</p>
            <Button type="button" onClick={() => runDemo("Correction logged for INV-2026-1042 (demo)")}>
              Log fee correction
            </Button>
          </div>
        )}

        {step === "update" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Update payment status, discounts, or approved adjustments.</p>
            <Button type="button" onClick={() => runDemo("Fee update applied · sibling discount 10% (demo)")}>
              Apply fee update
            </Button>
          </div>
        )}

        {step === "fine" && (
          <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Late fine %</Label>
              <Input className="mt-1" value={fineRate} onChange={(e) => setFineRate(e.target.value)} />
            </div>
            <Button type="button" onClick={() => runDemo(`Applied ${fineRate}% fine on 24 overdue vouchers (demo)`)}>
              Apply monthly fine
            </Button>
          </div>
        )}

        {step === "reconciliation" && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-bg text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-right">System</th>
                    <th className="px-3 py-2 text-right">Bank / KuickPay</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECON_ROWS.map((r) => (
                    <tr key={r.ref} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{r.ref}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(r.system)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(r.bank)}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            r.status === "matched" ? "success" : r.status === "missing_bank" ? "warning" : "danger"
                          }
                        >
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" onClick={() => runDemo("Reconciliation batch closed · 2 exceptions (demo)")}>
              Close reconciliation batch
            </Button>
          </div>
        )}

        {step === "statistics" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Collected (MTD)", value: formatCurrency(4_250_000) },
              { label: "Outstanding", value: formatCurrency(980_000) },
              { label: "Paid students", value: "186 / 214" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-bg px-4 py-3">
                <p className="text-xs text-muted">{k.label}</p>
                <p className="mt-1 text-lg font-bold text-heading">{k.value}</p>
              </div>
            ))}
            <div className="sm:col-span-3">
              <Button type="button" onClick={() => runDemo("Statistics refresh queued (demo)")}>
                Refresh statistics
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
