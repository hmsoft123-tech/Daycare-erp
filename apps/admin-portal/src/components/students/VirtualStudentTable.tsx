"use client";

import { useMemo, useState } from "react";
import { VirtualTable, type VirtualColumn } from "@kinder-pilot/ui";
import { formatDate } from "@/lib/utils";
import type { Student } from "@/types";
import Link from "next/link";
import { StatusPill } from "@/components/billing/StatusPill";
import { Button } from "@/components/ui/button";
import { EditStudentModal, type EditStudentValues } from "@/components/students/EditStudentModal";
import { Pencil } from "lucide-react";

/** DOM-virtualized student grid for high-row-count branch views */
export function VirtualStudentTable({ students: initial }: { students: Student[] }) {
  const [rows, setRows] = useState<Student[]>(initial);
  const [editing, setEditing] = useState<Student | null>(null);

  const columns = useMemo<VirtualColumn<Student>[]>(
    () => [
      {
        id: "name",
        header: "Student",
        cell: (row) => (
          <Link href={`/students/${row.id}`} className="font-semibold text-brand-500 hover:underline">
            {row.firstName} {row.lastName}
          </Link>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: (row) => row.className,
      },
      {
        id: "enrolled",
        header: "Enrolled",
        width: 140,
        cell: (row) => formatDate(row.enrollmentDate),
      },
      {
        id: "status",
        header: "Status",
        width: 120,
        cell: (row) => <StatusPill status={row.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        width: 100,
        cell: (row) => (
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(row)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ),
      },
    ],
    []
  );

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
    <>
      <VirtualTable
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        estimateSize={56}
        height={560}
        emptyMessage="No students in this branch yet"
      />
      <EditStudentModal
        open={!!editing}
        student={editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </>
  );
}
