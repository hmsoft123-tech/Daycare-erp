"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { StatusPill } from "./StatusPill";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import { ArrowUpDown } from "lucide-react";

interface InvoiceTableProps {
  invoices: Invoice[];
  students?: Record<string, string>;
}

export function InvoiceTable({ invoices, students = {} }: InvoiceTableProps) {
  const branchId = useBranchFilter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = useMemo(
    () => (branchId ? invoices.filter((i) => i.branchId === branchId) : invoices),
    [invoices, branchId]
  );

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Invoice # <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <Link href={`/billing/${row.original.id}`} className="font-medium text-brand-500 hover:underline">
            {row.original.invoiceNumber}
          </Link>
        ),
      },
      {
        accessorKey: "studentId",
        header: "Student",
        cell: ({ row }) => students[row.original.studentId] ?? row.original.studentId,
      },
      { accessorKey: "planType", header: "Plan" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.status as InvoiceStatus} />,
      },
    ],
    [students]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-[#F1F3F5] bg-[#F9FAFB]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-[#F1F3F5] last:border-0 hover:bg-[#F9FAFB]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5 text-heading">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
