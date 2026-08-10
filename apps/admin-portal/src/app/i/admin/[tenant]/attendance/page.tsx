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
        subtitle="Mark roll call and save — parents see it under School → Attendance"
        action={{ label: "Academics hub", href: "/academics" }}
      />
      <AttendanceGrid
        students={students}
        classes={classes}
        initialRecords={attendance}
        initialClassId={defaultClass?.id}
      />
      <div className="mt-4 flex flex-wrap gap-4">
        <Button variant="link" asChild>
          <Link href="/attendance/summary">Monthly summary →</Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/academics">Homework, notices & more →</Link>
        </Button>
      </div>
    </>
  );
}
