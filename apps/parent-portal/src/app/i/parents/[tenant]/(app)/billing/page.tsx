"use client";

import { useMemo, useState } from "react";
import { CreditCard, Download, CheckCircle2 } from "lucide-react";
import { formatPkr, mockInvoices } from "@/data/mock";
import { useBillingStore } from "@/lib/billing-store";
import { cn } from "@kinder-pilot/ui";

const statusStyle = {
  paid: "bg-soft-green text-success",
  pending: "bg-soft-yellow text-[#B76E00]",
  overdue: "bg-soft-red text-danger",
};

export default function ParentBillingPage() {
  const { paidInvoiceIds, markInvoicePaid } = useBillingStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const invoices = useMemo(
    () =>
      mockInvoices.map((inv) => ({
        ...inv,
        status: paidInvoiceIds.includes(inv.id) ? ("paid" as const) : inv.status,
      })),
    [paidInvoiceIds]
  );

  const enrollmentInvoice = invoices.find((i) => i.isEnrollmentInvoice && i.status === "pending");
  const due = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const handlePay = (invoiceId: string, childId?: string, label?: string) => {
    markInvoicePaid(invoiceId, childId);
    setSuccessMsg(label ? `${label} paid successfully! Portal unlocked.` : "Payment successful!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}
      <section>
        <h1 className="font-heading text-xl font-bold text-heading">Payments</h1>
        <p className="mt-1 text-sm text-muted">Invoices, tuition, and online pay</p>
      </section>

      {enrollmentInvoice && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Enrollment invoice — action required</p>
              <p className="mt-1 font-heading text-2xl font-bold text-heading">{formatPkr(enrollmentInvoice.amount)}</p>
              <p className="mt-1 text-sm text-amber-900">
                {enrollmentInvoice.number} · {enrollmentInvoice.childName}
              </p>
              <p className="text-xs text-amber-800">Due {enrollmentInvoice.dueDate} · {enrollmentInvoice.plan}</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-700">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <button
            onClick={() =>
              handlePay(enrollmentInvoice.id, enrollmentInvoice.childId, "Enrollment invoice")
            }
            className="mt-4 w-full rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_-6px_rgba(217,119,6,0.45)]"
          >
            Pay enrollment invoice
          </button>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Balance due</p>
            <p className="mt-1 font-heading text-3xl font-bold text-heading">{formatPkr(due)}</p>
          </div>
          <div className="rounded-full bg-brand-50 p-3 text-brand-600">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
        {due > 0 && !enrollmentInvoice && (
          <button
            onClick={() => {
              const next = invoices.find((i) => i.status === "pending");
              if (next) handlePay(next.id, next.childId);
            }}
            className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-6px_rgba(255,106,61,0.45)]"
          >
            Pay now
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-heading">Invoices</h2>
        <ul className="space-y-2.5">
          {invoices.map((inv) => (
            <li key={inv.id} className={cn(
              "rounded-2xl bg-surface p-4 shadow-card",
              inv.isEnrollmentInvoice && inv.status === "pending" && "ring-2 ring-amber-300"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-heading">{inv.number}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {inv.childName} · {inv.plan}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                    statusStyle[inv.status]
                  )}
                >
                  {inv.status}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-heading">{formatPkr(inv.amount)}</p>
                  <p className="text-[11px] text-muted">Due {inv.dueDate}</p>
                </div>
                <div className="flex gap-2">
                  {inv.status === "pending" && (
                    <button
                      onClick={() => handlePay(inv.id, inv.childId)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Pay
                    </button>
                  )}
                  {inv.status === "paid" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                    </span>
                  )}
                  <button className="inline-flex items-center gap-1 rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold text-muted">
                    <Download className="h-3.5 w-3.5" /> Receipt
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
