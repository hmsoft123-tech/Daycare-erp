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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusPill } from "@/components/billing/StatusPill";
import { EditStudentModal, type EditStudentValues } from "@/components/students/EditStudentModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { calculateAge, formatDate, getInitials } from "@/lib/utils";
import type { Student, StudentStatus } from "@/types";
import { ArrowUpDown, Pencil } from "lucide-react";

interface StudentTableProps {
  students: Student[];
}

export function StudentTable({ students: initial }: StudentTableProps) {
  const branchId = useBranchFilter();
  const [rows, setRows] = useState<Student[]>(initial);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);

  const filtered = useMemo(
    () => (branchId ? rows.filter((s) => s.branchId === branchId) : rows),
    [rows, branchId]
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
      {
        id: "actions",
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(row.original)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        ),
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

  const onSave = (id: string, values: EditStudentValues) => {
    setRows((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              firstName: values.firstName,
              lastName: values.lastName,
              dob: values.dob,
              gender: values.gender,
              bloodGroup: values.bloodGroup,
              classId: values.classId,
              className: values.className,
              branchId: values.branchId,
              status: values.status,
              feePlan: values.feePlan,
              allergies: values.allergies
                ? values.allergies.split(",").map((a) => a.trim()).filter(Boolean)
                : [],
            }
          : s
      )
    );
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search students..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
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

      <EditStudentModal
        open={!!editing}
        student={editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </div>
  );
}
