import { PageHeader } from "@/components/layout/PageHeader";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { getStudents, getTodayAttendance, getClasses } from "@/lib/mock-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AttendancePage() {
  const [classes, students] = await Promise.all([getClasses(), getStudents()]);
  const defaultClass = classes[0];
  const attendance = defaultClass
    ? await getTodayAttendance(defaultClass.id)
    : [];

  return (
    <>
      <PageHeader
        title="Daily Attendance"
        subtitle="Select a class and mark present, late, or absent"
        action={{ label: "View Summary", href: "/attendance/summary" }}
      />
      <AttendanceGrid
        students={students}
        classes={classes}
        initialRecords={attendance}
        initialClassId={defaultClass?.id}
      />
      <div className="mt-4">
        <Button variant="link" asChild>
          <Link href="/attendance/summary">Monthly summary →</Link>
        </Button>
      </div>
    </>
  );
}
