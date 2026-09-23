"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { VirtualTable, type VirtualColumn } from "@kinder-pilot/ui";
import { StatusPill } from "@/components/billing/StatusPill";
import { Button } from "@/components/ui/button";
import { EditStudentModal, type EditStudentValues } from "@/components/students/EditStudentModal";
import {
  FilterInput,
  FilterSelect,
  RangeFilter,
  SortControl,
  SortHeader,
  compareValues,
  type SortDir,
} from "@/components/common/FilterControls";
import { branches } from "@/data/branches";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { stamp } from "@/lib/audit";
import {
  ATTENDANCE_SORT_RANK,
  ATTENDANCE_STATUS_LABEL,
  TIMING_SLOT_LABEL,
  timingRange,
  type CurrentAttendance,
  type CurrentAttendanceStatus,
} from "@/lib/student-timing";
import { calculateAge, cn, formatDate, getInitials } from "@/lib/utils";
import type { Parent, Student, StudentStatus, StudentTimingSlot } from "@/types";

type SortKey =
  | "gr"
  | "name"
  | "gender"
  | "dob"
  | "registered"
  | "father"
  | "mother"
  | "class"
  | "branch"
  | "timing"
  | "attendance"
  | "status";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Student name" },
  { value: "gr", label: "GR number" },
  { value: "gender", label: "Gender" },
  { value: "dob", label: "Date of birth" },
  { value: "registered", label: "Registration date" },
  { value: "father", label: "Father's name" },
  { value: "mother", label: "Mother's name" },
  { value: "class", label: "Class / program" },
  { value: "branch", label: "Branch" },
  { value: "timing", label: "Timing" },
  { value: "attendance", label: "Attendance status" },
  { value: "status", label: "Student status" },
];

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending_first_payment", label: "Pending first payment" },
  { value: "inactive", label: "Inactive" },
  { value: "alumni", label: "Alumni" },
];

const ATTENDANCE_PILL: Record<CurrentAttendanceStatus, string> = {
  present: "bg-soft-green text-brand-700",
  late: "bg-soft-yellow text-[#B76E00]",
  absent: "bg-soft-red text-danger",
  leave: "bg-soft-blue text-[#4C8BF5]",
  not_marked: "bg-bg text-muted",
};

const TIMING_ORDER: Record<StudentTimingSlot, number> = {
  morning: 0,
  full_day: 1,
  extended: 2,
  afternoon: 3,
  after_school: 4,
};

const branchName = (id: string) => branches.find((b) => b.id === id)?.name.replace(" Campus", "") ?? "—";

type Props = {
  students: Student[];
  parents: Parent[];
  attendance: Record<string, CurrentAttendance>;
  /** School day the attendance column reports on */
  attendanceDate: string;
};

/** DOM-virtualized student grid — full register columns, filters and ordering */
export function VirtualStudentTable({ students: initial, parents, attendance: initialAttendance, attendanceDate }: Props) {
  const contextBranch = useBranchFilter();
  const [rows, setRows] = useState<Student[]>(initial);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [editing, setEditing] = useState<Student | null>(null);

  const [query, setQuery] = useState("");
  const [grQuery, setGrQuery] = useState("");
  const [parentQuery, setParentQuery] = useState("");
  const [branch, setBranch] = useState<string>(contextBranch ?? "all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [gender, setGender] = useState<"male" | "female" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("active");
  const [attendanceFilter, setAttendanceFilter] = useState<CurrentAttendanceStatus | "all">("all");
  const [program, setProgram] = useState<string>("all");
  const [timing, setTiming] = useState<StudentTimingSlot | "all">("all");
  const [dobFrom, setDobFrom] = useState("");
  const [dobTo, setDobTo] = useState("");
  const [regFrom, setRegFrom] = useState("");
  const [regTo, setRegTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [dir, setDir] = useState<SortDir>("asc");

  useEffect(() => setBranch(contextBranch ?? "all"), [contextBranch]);

  const parentMap = useMemo(() => Object.fromEntries(parents.map((p) => [p.id, p])), [parents]);
  const parentOf = (s: Student, relation: Parent["relation"]) =>
    s.parentIds.map((id) => parentMap[id]).find((p) => p?.relation === relation)?.name;

  const classes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.className).filter(Boolean))).sort(),
    [rows]
  );
  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.feePlan).filter((p): p is string => !!p))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const gr = grQuery.trim().toLowerCase();
    const pq = parentQuery.trim().toLowerCase();
    const sortValue = (s: Student): string | number | undefined => {
      switch (sortKey) {
        case "gr":
          return s.grNumber;
        case "gender":
          return s.gender;
        case "dob":
          return s.dob;
        case "registered":
          return s.enrollmentDate;
        case "father":
          return parentOf(s, "father");
        case "mother":
          return parentOf(s, "mother");
        case "class":
          return s.className;
        case "branch":
          return branchName(s.branchId);
        case "timing":
          return s.timing ? `${TIMING_ORDER[s.timing.slot]}${s.timing.from}` : undefined;
        case "attendance":
          return ATTENDANCE_SORT_RANK[attendance[s.id]?.status ?? "not_marked"];
        case "status":
          return s.status;
        case "name":
        default:
          return `${s.firstName} ${s.lastName}`;
      }
    };
    return rows
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (branch !== "all" && s.branchId !== branch) return false;
        if (classFilter !== "all" && s.className !== classFilter) return false;
        if (gender !== "all" && s.gender !== gender) return false;
        if (program !== "all" && s.feePlan !== program) return false;
        if (timing !== "all" && s.timing?.slot !== timing) return false;
        if (attendanceFilter !== "all" && (attendance[s.id]?.status ?? "not_marked") !== attendanceFilter) return false;
        if (dobFrom && s.dob < dobFrom) return false;
        if (dobTo && s.dob > dobTo) return false;
        if (regFrom && s.enrollmentDate < regFrom) return false;
        if (regTo && s.enrollmentDate > regTo) return false;
        if (gr && !(s.grNumber?.toLowerCase().includes(gr) ?? false)) return false;
        if (pq) {
          const names = s.parentIds.map((id) => parentMap[id]?.name.toLowerCase() ?? "");
          if (!names.some((n) => n.includes(pq))) return false;
        }
        if (q && !`${s.firstName} ${s.lastName}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => compareValues(sortValue(a), sortValue(b), dir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, grQuery, parentQuery, branch, classFilter, gender, statusFilter, attendanceFilter, program, timing, dobFrom, dobTo, regFrom, regTo, sortKey, dir, attendance, parentMap]);

  const markToday = (s: Student, status: "present" | "absent") => {
    const now = new Date();
    const checkIn = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setAttendance((prev) => ({
      ...prev,
      [s.id]: { ...prev[s.id], date: attendanceDate, status, checkIn: status === "present" ? checkIn : undefined },
    }));
    toast.success(status === "present" ? `${s.firstName} checked in at ${checkIn}` : `${s.firstName} marked absent`);
  };

  const onSort = (k: SortKey, d: SortDir) => {
    setSortKey(k);
    setDir(d);
  };
  const header = (label: string, column: SortKey) => (
    <SortHeader label={label} column={column} sortKey={sortKey} dir={dir} onSort={onSort} />
  );

  const columns: VirtualColumn<Student>[] = [
    {
      id: "gr",
      header: header("GR No.", "gr"),
      width: 110,
      cell: (row) => <span className="font-mono text-xs font-semibold text-heading">{row.grNumber ?? "—"}</span>,
    },
    {
      id: "name",
      header: header("Student name", "name"),
      width: 210,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
            {row.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(`${row.firstName} ${row.lastName}`)
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/students/${row.id}`} className="block truncate font-semibold text-brand-500 hover:underline">
              {row.firstName} {row.lastName}
            </Link>
            <StatusPill status={row.status} className="mt-0.5 scale-90 origin-left" />
          </div>
        </div>
      ),
    },
    {
      id: "gender",
      header: header("Gender", "gender"),
      width: 90,
      cell: (row) => <span className="capitalize text-muted">{row.gender}</span>,
    },
    {
      id: "dob",
      header: header("Date of birth", "dob"),
      width: 125,
      cell: (row) => (
        <div className="leading-tight">
          <p>{formatDate(row.dob)}</p>
          <p className="text-[11px] text-muted">{calculateAge(row.dob)} yrs</p>
        </div>
      ),
    },
    {
      id: "registered",
      header: header("Registered", "registered"),
      width: 120,
      cell: (row) => formatDate(row.enrollmentDate),
    },
    {
      id: "father",
      header: header("Father", "father"),
      width: 145,
      cell: (row) => <span className="truncate">{parentOf(row, "father") ?? "—"}</span>,
    },
    {
      id: "mother",
      header: header("Mother", "mother"),
      width: 145,
      cell: (row) => <span className="truncate">{parentOf(row, "mother") ?? "—"}</span>,
    },
    {
      id: "class",
      header: header("Class / Program", "class"),
      width: 170,
      cell: (row) => (
        <div className="min-w-0 leading-tight">
          <p className="truncate">{row.className}</p>
          {row.feePlan && <p className="truncate text-[11px] text-muted">{row.feePlan}</p>}
        </div>
      ),
    },
    {
      id: "branch",
      header: header("Branch", "branch"),
      width: 115,
      cell: (row) => branchName(row.branchId),
    },
    {
      id: "timing",
      header: header("Timing", "timing"),
      width: 160,
      cell: (row) =>
        row.timing ? (
          <div className="leading-tight">
            <p className="font-medium">{TIMING_SLOT_LABEL[row.timing.slot]}</p>
            <p className="text-[11px] text-muted">{timingRange(row.timing)}</p>
          </div>
        ) : (
          <span className="text-xs text-muted">Not set</span>
        ),
    },
    {
      id: "attendance",
      header: header("Attendance", "attendance"),
      width: 190,
      cell: (row) => {
        const a = attendance[row.id];
        const st = a?.status ?? "not_marked";
        if (st === "not_marked" && row.status === "active") {
          return (
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => markToday(row, "present")}>
                Check in
              </Button>
              <button
                type="button"
                className="text-xs font-semibold text-muted hover:text-danger"
                onClick={() => markToday(row, "absent")}
              >
                Absent
              </button>
            </div>
          );
        }
        return (
          <div className="leading-tight">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", ATTENDANCE_PILL[st])}>
              {ATTENDANCE_STATUS_LABEL[st]}
            </span>
            {a?.checkIn && <p className="mt-0.5 text-[11px] text-muted">In {a.checkIn}{a.checkOut ? ` · Out ${a.checkOut}` : ""}</p>}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      width: 60,
      cell: (row) => (
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(row)} aria-label="Edit student">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

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
              lastUpdated: stamp(),
            }
          : s
      )
    );
  };

  const resetAll = () => {
    setQuery("");
    setGrQuery("");
    setParentQuery("");
    setBranch(contextBranch ?? "all");
    setClassFilter("all");
    setGender("all");
    setStatusFilter("active");
    setAttendanceFilter("all");
    setProgram("all");
    setTiming("all");
    setDobFrom("");
    setDobTo("");
    setRegFrom("");
    setRegTo("");
    setSortKey("name");
    setDir("asc");
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterInput label="Student" placeholder="Name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <FilterInput label="GR number" placeholder="e.g. NN-45341" value={grQuery} onChange={(e) => setGrQuery(e.target.value)} />
        <FilterInput label="Parent name" placeholder="Father or mother" value={parentQuery} onChange={(e) => setParentQuery(e.target.value)} />
        <FilterSelect
          label="Branch"
          value={branch}
          onChange={setBranch}
          allLabel="All branches"
          options={branches.map((b) => ({ value: b.id, label: branchName(b.id) }))}
        />
        <FilterSelect label="Class" value={classFilter} onChange={setClassFilter} options={classes.map((c) => ({ value: c, label: c }))} />
        <FilterSelect label="Program" value={program} onChange={setProgram} options={programs.map((p) => ({ value: p, label: p }))} />
        <FilterSelect
          label="Gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
        <FilterSelect label="Student status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        <FilterSelect
          label="Attendance status"
          value={attendanceFilter}
          onChange={setAttendanceFilter}
          options={(Object.keys(ATTENDANCE_STATUS_LABEL) as CurrentAttendanceStatus[]).map((s) => ({
            value: s,
            label: ATTENDANCE_STATUS_LABEL[s],
          }))}
        />
        <FilterSelect
          label="Timing"
          value={timing}
          onChange={setTiming}
          options={(Object.keys(TIMING_SLOT_LABEL) as StudentTimingSlot[]).map((t) => ({ value: t, label: TIMING_SLOT_LABEL[t] }))}
        />
        <RangeFilter label="Date of birth" type="date" from={dobFrom} to={dobTo} onFrom={setDobFrom} onTo={setDobTo} className="lg:col-span-2" />
        <RangeFilter label="Registration date" type="date" from={regFrom} to={regTo} onFrom={setRegFrom} onTo={setRegTo} className="lg:col-span-2" />
        <div className="sm:col-span-2">
          <SortControl sortKey={sortKey} dir={dir} options={SORT_OPTIONS} onKey={setSortKey} onDir={setDir} />
        </div>
        <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-6">
          <span className="text-xs text-muted">
            Showing {filtered.length} of {rows.length} · attendance for {formatDate(attendanceDate, "EEE, d MMM yyyy")}
          </span>
          <button type="button" className="text-xs font-semibold text-brand-600" onClick={resetAll}>
            Reset all
          </button>
        </div>
      </div>

      <VirtualTable
        rows={filtered}
        columns={columns}
        getRowId={(r) => r.id}
        estimateSize={64}
        height={560}
        minWidth={1660}
        emptyMessage="No students match these filters"
      />

      <p className="text-[11px] text-muted">
        Check-in from this list is a quick mark for the day · full roll call remains on Attendance.
      </p>

      <EditStudentModal open={!!editing} student={editing} onClose={() => setEditing(null)} onSave={onSave} />
    </div>
  );
}
