import type { AttendanceStatus, StudentTiming, StudentTimingSlot } from "@/types";

export const TIMING_SLOT_LABEL: Record<StudentTimingSlot, string> = {
  morning: "Morning",
  full_day: "Full Day",
  extended: "Extended",
  afternoon: "Afternoon",
  after_school: "After School",
};

/** "08:00" → "8:00 AM" */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "8:00 AM – 12:30 PM" */
export function timingRange(t?: StudentTiming): string {
  if (!t) return "—";
  return `${formatClock(t.from)} – ${formatClock(t.to)}`;
}

/** "Morning · 8:00 AM – 12:30 PM" */
export function timingLabel(t?: StudentTiming): string {
  if (!t) return "Not set";
  return `${TIMING_SLOT_LABEL[t.slot]} · ${timingRange(t)}`;
}

export type CurrentAttendanceStatus = AttendanceStatus | "not_marked";

/** Student's attendance as of the school day */
export interface CurrentAttendance {
  status: CurrentAttendanceStatus;
  /** Date of the school day being reported */
  date: string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  /** Latest earlier mark — shown when today is not yet marked */
  last?: { date: string; status: AttendanceStatus };
}

export const ATTENDANCE_STATUS_LABEL: Record<CurrentAttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "On leave",
  not_marked: "Not marked",
};

/** Sort order for "attendance" column: present first, not marked last */
export const ATTENDANCE_SORT_RANK: Record<CurrentAttendanceStatus, number> = {
  present: 0,
  late: 1,
  leave: 2,
  absent: 3,
  not_marked: 4,
};
