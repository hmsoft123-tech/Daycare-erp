"use client";

import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";
import type { StaffRole } from "@/types";

interface PayrollRow {
  id: string;
  name: string;
  role: StaffRole;
  branchId: string;
  baseSalary: number;
  deductions: number;
}

export function PayrollClient({ payroll }: { payroll: PayrollRow[] }) {
  const branchId = useBranchFilter();
  const filtered = useMemo(
    () => (branchId ? payroll.filter((p) => p.branchId === branchId) : payroll),
    [payroll, branchId]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">Employee</th>
            <th className="pb-2">Role</th>
            <th className="pb-2 text-right">Base Salary</th>
            <th className="pb-2 text-right">Deductions</th>
            <th className="pb-2 text-right">Net Pay</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-3 font-medium">{row.name}</td>
              <td className="py-3 capitalize">{row.role}</td>
              <td className="py-3 text-right">{formatCurrency(row.baseSalary)}</td>
              <td className="py-3 text-right text-red-600">-{formatCurrency(row.deductions)}</td>
              <td className="py-3 text-right font-semibold">{formatCurrency(row.baseSalary - row.deductions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
