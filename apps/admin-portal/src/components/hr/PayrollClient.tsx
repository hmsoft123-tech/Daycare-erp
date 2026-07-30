"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { STAFF_SHIFT_OPTIONS } from "@/lib/salary-determination";
import { cn, formatCurrency } from "@/lib/utils";
import type { SalaryLineKind, StaffRole, StaffShiftKey } from "@/types";

export type PayrollBreakdownRow = {
  staffId: string;
  name: string;
  role: StaffRole;
  branchId: string;
  shift: StaffShiftKey;
  baseSalary: number;
  allowances: number;
  deductions: number;
  net: number;
  lines: { id: string; label: string; kind: SalaryLineKind; amount: number; notes?: string }[];
  educationLevel?: string;
  experienceYears?: number;
  yearsAtSdlc?: number;
};

export function PayrollClient({ payroll }: { payroll: PayrollBreakdownRow[] }) {
  const branchId = useBranchFilter();
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(
    () => (branchId ? payroll.filter((p) => p.branchId === branchId) : payroll),
    [payroll, branchId]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="w-8 pb-2" />
            <th className="pb-2">Employee</th>
            <th className="pb-2">Role / shift</th>
            <th className="pb-2 text-right">Base</th>
            <th className="pb-2 text-right">+ Lines</th>
            <th className="pb-2 text-right">− Deductions</th>
            <th className="pb-2 text-right">Net pay</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const open = openId === row.staffId;
            const shiftLabel = STAFF_SHIFT_OPTIONS.find((s) => s.key === row.shift)?.label ?? row.shift;
            return (
              <Fragment key={row.staffId}>
                <tr className="border-b border-[#F1F3F5]">
                  <td className="py-3">
                    <button
                      type="button"
                      className="rounded p-1 text-muted hover:bg-bg"
                      onClick={() => setOpenId(open ? null : row.staffId)}
                      aria-label={open ? "Hide breakdown" : "Show breakdown"}
                    >
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="py-3">
                    <Link href={`/hr/staff/${row.staffId}`} className="font-medium text-brand-800 hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-3">
                    <p className="capitalize">{row.role}</p>
                    <p className="text-[11px] text-muted">{shiftLabel}</p>
                  </td>
                  <td className="py-3 text-right">{formatCurrency(row.baseSalary)}</td>
                  <td className="py-3 text-right text-brand-700">
                    {row.allowances > 0 ? `+${formatCurrency(row.allowances)}` : "—"}
                  </td>
                  <td className="py-3 text-right text-danger">
                    {row.deductions > 0 ? `−${formatCurrency(row.deductions)}` : "—"}
                  </td>
                  <td className="py-3 text-right font-semibold">{formatCurrency(row.net)}</td>
                </tr>
                {open && (
                  <tr className="border-b bg-[#F9FAFB]">
                    <td colSpan={7} className="px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                        Pay-slip breakdown (from staff salary determination)
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex justify-between gap-4">
                          <span>Base salary bracket</span>
                          <span className="font-medium">{formatCurrency(row.baseSalary)}</span>
                        </li>
                        {(row.educationLevel ||
                          row.experienceYears != null ||
                          row.yearsAtSdlc != null) && (
                          <li className="text-[11px] text-muted">
                            {[
                              row.educationLevel && `Education: ${row.educationLevel}`,
                              row.experienceYears != null && `Past exp: ${row.experienceYears} yrs`,
                              row.yearsAtSdlc != null && `At SDLC: ${row.yearsAtSdlc} yrs`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </li>
                        )}
                        {row.lines.length === 0 && (
                          <li className="text-xs text-muted">No active adjustment / deduction lines.</li>
                        )}
                        {row.lines.map((l) => (
                          <li key={l.id} className="flex justify-between gap-4">
                            <span>
                              <span className="capitalize text-muted">{l.kind}</span>
                              {" · "}
                              {l.label}
                              {l.notes ? (
                                <span className="block text-[11px] text-muted">{l.notes}</span>
                              ) : null}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 font-medium",
                                l.amount < 0 ? "text-danger" : "text-heading"
                              )}
                            >
                              {l.amount < 0 ? "−" : "+"}
                              {formatCurrency(Math.abs(l.amount))}
                            </span>
                          </li>
                        ))}
                        <li className="flex justify-between gap-4 border-t border-[#E9ECEF] pt-2 font-semibold">
                          <span>Net pay</span>
                          <span>{formatCurrency(row.net)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
