"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  chartOfAccounts,
  financeVouchers,
  fixedAssets,
  type AccountType,
  type FinanceVoucherKind,
} from "@/data/finance";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_ORDER: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Current Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
};

const VOUCHER_LABEL: Record<FinanceVoucherKind, string> = {
  journal: "Journal voucher",
  cash: "Cash voucher",
  bank: "Bank voucher",
};

type Tab = "coa" | "vouchers" | "assets" | "reports";

export function FinanceHub() {
  const [tab, setTab] = useState<Tab>("coa");

  const grouped = useMemo(() => {
    return TYPE_ORDER.map((type) => ({
      type,
      rows: chartOfAccounts.filter((a) => a.type === type),
    }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["coa", "Chart of Accounts"],
            ["vouchers", "Vouchers"],
            ["assets", "Fixed Assets"],
            ["reports", "Reports"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "coa" && (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.type} className="overflow-hidden rounded-2xl bg-surface shadow-card">
              <div className="border-b border-border bg-bg px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">
                {TYPE_LABEL[g.type]}
              </div>
              <ul className="divide-y divide-border">
                {g.rows.map((a) => (
                  <li key={a.code} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className={a.parentCode ? "pl-4 text-heading" : "font-semibold text-heading"}>
                      <span className="mr-3 font-mono text-xs text-muted">{a.code}</span>
                      {a.name}
                    </span>
                    {!a.parentCode && <Badge variant="secondary">Header</Badge>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "vouchers" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" onClick={() => toast.message("New voucher — demo shell")}>
              New voucher
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-bg text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Narration</th>
                  <th className="px-4 py-3 text-left">Dr / Cr</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {financeVouchers.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-4 py-3">{formatDate(v.date)}</td>
                    <td className="px-4 py-3">{VOUCHER_LABEL[v.kind]}</td>
                    <td className="px-4 py-3 font-medium text-heading">{v.narration}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {v.debitAccount} / {v.creditAccount}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(v.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={v.status === "posted" ? "success" : "warning"} className="capitalize">
                        {v.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "assets" && (
        <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-bg text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Purchased</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Book value</th>
              </tr>
            </thead>
            <tbody>
              {fixedAssets.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-heading">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.category}</td>
                  <td className="px-4 py-3 text-muted">
                    {branches.find((b) => b.id === a.branchId)?.name.replace(" Campus", "") ?? a.branchId}
                  </td>
                  <td className="px-4 py-3">{formatDate(a.purchaseDate)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(a.cost)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(a.bookValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Trial Balance",
            "Profit & Loss",
            "Balance Sheet",
            "Cash Book",
            "Bank Book",
            "Fixed Asset Register",
          ].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toast.message(`${name} — demo export queued`)}
              className="rounded-2xl border border-border bg-surface px-4 py-4 text-left shadow-card hover:border-brand-200"
            >
              <p className="font-semibold text-heading">{name}</p>
              <p className="mt-1 text-xs text-muted">Filterable · exportable (demo)</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
