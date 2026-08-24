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

const gateways = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "card", label: "Debit / Credit card" },
  { id: "bank", label: "Bank transfer" },
] as const;

export default function ParentBillingPage() {
  const { paidInvoiceIds, markInvoicePaid } = useBillingStore();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<{
    id: string;
    childId?: string;
    label?: string;
    amount: number;
  } | null>(null);
  const [gateway, setGateway] = useState<(typeof gateways)[number]["id"]>("jazzcash");
  const [receipts, setReceipts] = useState<
    { id: string; number: string; amount: number; method: string; at: string }[]
  >([]);

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

  const confirmPay = () => {
    if (!payTarget) return;
    markInvoicePaid(payTarget.id, payTarget.childId);
    const inv = invoices.find((i) => i.id === payTarget.id);
    setReceipts((prev) => [
      {
        id: `rcpt-${Date.now()}`,
        number: inv?.number ?? payTarget.id,
        amount: payTarget.amount,
        method: gateways.find((g) => g.id === gateway)?.label ?? gateway,
        at: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setSuccessMsg(
      payTarget.label
        ? `${payTarget.label} paid via ${gateway} — portal unlocked.`
        : `Payment successful via ${gateway}. Receipt ready.`
    );
    setPayTarget(null);
    setTimeout(() => setSuccessMsg(null), 4500);
  };

  const downloadReceipt = (text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl lg:text-3xl">
          Payments
        </h1>
        <p className="mt-1 text-sm text-muted">
          Invoices · JazzCash / card / bank · downloadable receipts
        </p>
      </section>

      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-card">
            <p className="text-sm font-bold text-heading">Choose payment method</p>
            <p className="mt-1 text-xs text-muted">
              Amount {formatPkr(payTarget.amount)} · demo gateway (no live charges)
            </p>
            <div className="mt-3 space-y-2">
              {gateways.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGateway(g.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold",
                    gateway === g.id
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-black/10 text-heading"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="flex-1 rounded-xl bg-bg py-2.5 text-sm font-semibold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPay}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white"
              >
                Confirm pay
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-4">
          {enrollmentInvoice && (
            <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Enrollment invoice — action required
              </p>
              <p className="mt-1 font-heading text-2xl font-bold text-heading">
                {formatPkr(enrollmentInvoice.amount)}
              </p>
              <button
                type="button"
                onClick={() =>
                  setPayTarget({
                    id: enrollmentInvoice.id,
                    childId: enrollmentInvoice.childId,
                    label: "Enrollment invoice",
                    amount: enrollmentInvoice.amount,
                  })
                }
                className="mt-4 w-full rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white"
              >
                Pay enrollment invoice
              </button>
            </section>
          )}

          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Balance due</p>
            <p className="mt-1 font-heading text-3xl font-bold text-heading">{formatPkr(due)}</p>
            {due > 0 && !enrollmentInvoice && (
              <button
                type="button"
                onClick={() => {
                  const next = invoices.find((i) => i.status === "pending");
                  if (next)
                    setPayTarget({
                      id: next.id,
                      childId: next.childId,
                      amount: next.amount,
                    });
                }}
                className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white"
              >
                Pay now
              </button>
            )}
          </section>

          {receipts.length > 0 && (
            <section className="rounded-2xl bg-surface p-4 shadow-card">
              <p className="text-sm font-bold">Recent receipts</p>
              <ul className="mt-2 space-y-2">
                {receipts.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span>
                      {r.number} · {formatPkr(r.amount)} · {r.method}
                    </span>
                    <button
                      type="button"
                      className="font-semibold text-brand-600"
                      onClick={() =>
                        downloadReceipt(
                          `Kinder Pilot Receipt\n${r.number}\nAmount: ${r.amount}\nMethod: ${r.method}\nPaid: ${r.at}\n`
                        )
                      }
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="lg:col-span-8">
          <h2 className="mb-3 text-sm font-bold text-heading">Invoices</h2>
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className={cn(
                  "rounded-2xl bg-surface p-4 shadow-card",
                  inv.isEnrollmentInvoice && inv.status === "pending" && "ring-2 ring-amber-300"
                )}
              >
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
                        type="button"
                        onClick={() =>
                          setPayTarget({
                            id: inv.id,
                            childId: inv.childId,
                            amount: inv.amount,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> Pay
                      </button>
                    )}
                    {inv.status === "paid" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        downloadReceipt(
                          `Receipt for ${inv.number}\nChild: ${inv.childName}\nAmount: ${inv.amount}\nStatus: ${inv.status}\n`
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold text-muted"
                    >
                      <Download className="h-3.5 w-3.5" /> Receipt
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
