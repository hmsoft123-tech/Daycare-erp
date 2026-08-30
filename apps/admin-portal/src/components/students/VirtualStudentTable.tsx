"use client";

import { useMemo, useState } from "react";
import { VirtualTable, type VirtualColumn } from "@kinder-pilot/ui";
import { formatDate, getInitials } from "@/lib/utils";
import type { Student } from "@/types";
import Link from "next/link";
import { StatusPill } from "@/components/billing/StatusPill";
import { Button } from "@/components/ui/button";
import { EditStudentModal, type EditStudentValues } from "@/components/students/EditStudentModal";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DailyStatus = "out" | "in" | "absent";

/** DOM-virtualized student grid — Brightwheel-style filters + daily check-in */
export function VirtualStudentTable({ students: initial }: { students: Student[] }) {
  const [rows, setRows] = useState<Student[]>(initial);
  const [editing, setEditing] = useState<Student | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Student["status"]>("active");
  const [roomFilter, setRoomFilter] = useState("all");
  const [daily, setDaily] = useState<Record<string, DailyStatus>>({});

  const rooms = useMemo(
    () => Array.from(new Set(rows.map((r) => r.className).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (roomFilter !== "all" && s.className !== roomFilter) return false;
      if (!q) return true;
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(q) || (s.grNumber?.toLowerCase().includes(q) ?? false);
    });
  }, [rows, query, statusFilter, roomFilter]);

  const setAttendance = (id: string, next: DailyStatus, label: string) => {
    setDaily((prev) => ({ ...prev, [id]: next }));
    toast.success(label);
  };

  const columns = useMemo<VirtualColumn<Student>[]>(
    () => [
      {
        id: "name",
        header: "Student",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
              {row.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(`${row.firstName} ${row.lastName}`)
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/students/${row.id}`} className="font-semibold text-brand-500 hover:underline">
                {row.firstName} {row.lastName}
              </Link>
              <p className="truncate text-[11px] text-muted">{row.className}</p>
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 110,
        cell: (row) => <StatusPill status={row.status} />,
      },
      {
        id: "enrolled",
        header: "Enrolled",
        width: 120,
        cell: (row) => formatDate(row.enrollmentDate),
      },
      {
        id: "attendance",
        header: "Daily attendance",
        width: 220,
        cell: (row) => {
          const st = daily[row.id] ?? "out";
          return (
            <div className="flex items-center gap-2">
              {st === "in" ? (
                <span className="text-xs font-semibold text-success">Checked in</span>
              ) : st === "absent" ? (
                <span className="text-xs font-semibold text-danger">Absent</span>
              ) : (
                <>
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-600 hover:underline"
                    onClick={() => setAttendance(row.id, "absent", `${row.firstName} marked absent`)}
                  >
                    Mark absent
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAttendance(row.id, "in", `${row.firstName} checked in`)}
                  >
                    Check in
                  </Button>
                </>
              )}
              {st !== "out" && (
                <button
                  type="button"
                  className="text-[10px] text-muted hover:underline"
                  onClick={() => setAttendance(row.id, "out", "Reset attendance")}
                >
                  Reset
                </button>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        width: 80,
        cell: (row) => (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ),
      },
    ],
    [daily]
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Student"
          className="h-9 w-40 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="alumni">Alumni</option>
        </select>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="h-9 rounded-xl border border-[#DFE3E8] bg-white px-3 text-xs"
        >
          <option value="all">Room</option>
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="text-xs font-semibold text-brand-600"
          onClick={() => {
            setQuery("");
            setStatusFilter("active");
            setRoomFilter("all");
          }}
        >
          Reset all
        </button>
        <span className="ml-auto text-xs text-muted">
          Showing {filtered.length} · Sort by First name
        </span>
      </div>

      <VirtualTable
        rows={filtered}
        columns={columns}
        getRowId={(r) => r.id}
        estimateSize={64}
        height={560}
        emptyMessage="No students match these filters"
      />

      <p className={cn("text-[11px] text-muted")}>
        Check-in actions are demo-local on this list · full roll call remains on Attendance.
      </p>

      <EditStudentModal
        open={!!editing}
        student={editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </div>
  );
}
