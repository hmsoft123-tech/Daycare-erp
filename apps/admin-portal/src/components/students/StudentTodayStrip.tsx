import { CalendarCheck, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LastUpdated } from "@/components/common/LastUpdated";
import {
  ATTENDANCE_STATUS_LABEL,
  TIMING_SLOT_LABEL,
  timingRange,
  type CurrentAttendance,
} from "@/lib/student-timing";
import { cn, formatDate } from "@/lib/utils";
import type { Student } from "@/types";

const TONE: Record<CurrentAttendance["status"], string> = {
  present: "bg-soft-green text-brand-700",
  late: "bg-soft-yellow text-[#B76E00]",
  absent: "bg-soft-red text-danger",
  leave: "bg-soft-blue text-[#4C8BF5]",
  not_marked: "bg-bg text-muted",
};

/** Current attendance, timing and last-updated — shown at the top of the student profile */
export function StudentTodayStrip({ student, attendance }: { student: Student; attendance?: CurrentAttendance }) {
  const status = attendance?.status ?? "not_marked";
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Attendance · {attendance ? formatDate(attendance.date, "EEE d MMM") : "today"}
            </p>
            <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status])}>
              {ATTENDANCE_STATUS_LABEL[status]}
            </span>
            {attendance?.checkIn && (
              <p className="mt-1 text-xs text-muted">
                Checked in {attendance.checkIn}
                {attendance.checkOut ? ` · out ${attendance.checkOut}` : ""}
              </p>
            )}
            {attendance?.note && <p className="mt-1 text-xs text-muted">{attendance.note}</p>}
            {status === "not_marked" && attendance?.last && (
              <p className="mt-1 text-xs text-muted">
                Last marked {ATTENDANCE_STATUS_LABEL[attendance.last.status].toLowerCase()} on{" "}
                {formatDate(attendance.last.date)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Timing</p>
            {student.timing ? (
              <>
                <p className="mt-1 text-sm font-semibold text-heading">{TIMING_SLOT_LABEL[student.timing.slot]}</p>
                <p className="text-xs text-muted">{timingRange(student.timing)}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Not set</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Student record</p>
          <LastUpdated stamp={student.lastUpdated} className="mt-1.5" />
        </CardContent>
      </Card>
    </div>
  );
}
