"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusPill } from "@/components/billing/StatusPill";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { calculateAge, formatDate, getInitials } from "@/lib/utils";
import type { Student, StudentStatus } from "@/types";
import { ArrowUpDown } from "lucide-react";

interface StudentTableProps {
  students: Student[];
}

export function StudentTable({ students }: StudentTableProps) {
  const branchId = useBranchFilter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const filtered = useMemo(
    () => (branchId ? students.filter((s) => s.branchId === branchId) : students),
    [students, branchId]
  );

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
            Student <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {row.original.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.original.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="text-xs">
                  {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
                </AvatarFallback>
              )}
            </Avatar>
            <Link href={`/students/${row.original.id}`} className="font-medium text-brand-500 hover:underline">
              {row.original.firstName} {row.original.lastName}
            </Link>
          </div>
        ),
      },
      { accessorKey: "className", header: "Class" },
      {
        id: "age",
        header: "Age",
        cell: ({ row }) => calculateAge(row.original.dob),
      },
      {
        accessorKey: "enrollmentDate",
        header: "Enrolled",
        cell: ({ row }) => formatDate(row.original.enrollmentDate),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.status as StudentStatus} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search students..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-600">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
