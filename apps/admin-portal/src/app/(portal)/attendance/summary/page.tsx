import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudents, getStudentAttendance } from "@/lib/mock-service";
import { AttendanceSummaryClient } from "./AttendanceSummaryClient";

export default async function AttendanceSummaryPage() {
  const students = await getStudents({ status: "active" });
  const summaries = await Promise.all(
    students.slice(0, 8).map(async (s) => {
      const records = await getStudentAttendance(s.id);
      const present = records.filter((r) => r.status === "present" || r.status === "late").length;
      const rate = records.length ? Math.round((present / records.length) * 100) : 0;
      return { id: s.id, name: `${s.firstName} ${s.lastName}`, className: s.className, rate, present, total: records.length };
    })
  );

  return (
    <>
      <PageHeader title="Attendance Summary" subtitle="Monthly attendance rates by student" />
      <AttendanceSummaryClient summaries={summaries} />
    </>
  );
}
