"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import {
  formatSchoolDate,
  mockAttendance,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/data/school";
import { fetchSchoolAttendance } from "@/lib/school-api";

type PeriodMode = "year" | "month" | "daily";

const periodModes: { id: PeriodMode; label: string }[] = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "daily", label: "Daily" },
];

const statusFilters: { id: "all" | AttendanceStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "present", label: "Present" },
  { id: "absent", label: "Absent" },
  { id: "late", label: "Late" },
  { id: "leave", label: "Leave" },
];

const statusStyle: Record<AttendanceStatus, string> = {
  present: "bg-soft-green text-[#0E9F6E]",
  absent: "bg-soft-red text-danger",
  late: "bg-soft-yellow text-[#B76E00]",
  leave: "bg-soft-blue text-[#4C8BF5]",
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [childId, setChildId] = useState("all");
  const [status, setStatus] = useState<"all" | AttendanceStatus>("all");
  const [period, setPeriod] = useState<PeriodMode>("month");
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("2026-08");
  const [day, setDay] = useState("2026-08-10");

  useEffect(() => {
    fetchSchoolAttendance().then(setRecords);
  }, []);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.date.slice(0, 4)))).sort((a, b) =>
        b.localeCompare(a)
      ),
    [records]
  );

  const rows = useMemo(() => {
    return records
      .filter((r) => {
        const childOk = childId === "all" || r.childId === childId;
        const statusOk = status === "all" || r.status === status;
        const periodOk =
          period === "year"
            ? r.date.startsWith(year)
            : period === "month"
              ? r.date.startsWith(month)
              : r.date === day;
        return childOk && statusOk && periodOk;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, childId, status, period, year, month, day]);

  const summary = useMemo(() => {
    return {
      present: rows.filter((r) => r.status === "present").length,
      absent: rows.filter((r) => r.status === "absent").length,
      late: rows.filter((r) => r.status === "late").length,
      leave: rows.filter((r) => r.status === "leave").length,
    };
  }, [rows]);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Attendance"
        subtitle="From school roll call · filter by year / month / day"
      />

      <ChildFilterChips value={childId} onChange={setChildId} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">Period</span>
          <div className="inline-flex rounded-xl bg-surface p-1 shadow-card">
            {periodModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPeriod(m.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  period === m.id
                    ? "bg-brand-500 text-white"
                    : "text-muted hover:text-heading"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {period === "year" && (
            <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs shadow-card">
              <span className="font-semibold text-muted">Year</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-transparent font-semibold text-heading outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}

          {period === "month" && (
            <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs shadow-card">
              <span className="font-semibold text-muted">Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent font-semibold text-heading outline-none"
              />
            </label>
          )}

          {period === "daily" && (
            <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs shadow-card">
              <span className="font-semibold text-muted">Date</span>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="bg-transparent font-semibold text-heading outline-none"
              />
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                status === f.id
                  ? "bg-brand-500 text-white"
                  : "bg-surface text-muted shadow-card"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["Present", summary.present, "text-[#0E9F6E]"],
            ["Absent", summary.absent, "text-danger"],
            ["Late", summary.late, "text-[#B76E00]"],
            ["Leave", summary.leave, "text-[#4C8BF5]"],
          ] as const
        ).map(([label, count, color]) => (
          <div key={label} className="rounded-2xl bg-surface p-3 shadow-card">
            <p className="text-[11px] font-semibold text-muted">{label}</p>
            <p className={cn("mt-0.5 font-heading text-2xl font-bold", color)}>{count}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-surface p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-heading">{formatSchoolDate(r.date)}</p>
                <p className="text-xs text-muted">{r.childName}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                  statusStyle[r.status]
                )}
              >
                {r.status}
              </span>
            </div>
            {(r.checkIn || r.checkOut) && (
              <p className="mt-2 text-xs text-heading">
                {r.checkIn ? `In ${r.checkIn}` : ""}
                {r.checkIn && r.checkOut ? " · " : ""}
                {r.checkOut ? `Out ${r.checkOut}` : ""}
              </p>
            )}
            {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted md:col-span-2">
            No attendance records for these filters.
          </li>
        )}
      </ul>
    </div>
  );
}
