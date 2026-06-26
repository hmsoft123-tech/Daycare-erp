import { PageHeader } from "@/components/layout/PageHeader";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { getStudents, getTodayAttendance, getClasses } from "@/lib/mock-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AttendancePage() {
  const classes = await getClasses();
  const defaultClass = classes[0];
  const [students, attendance] = await Promise.all([
    getStudents(defaultClass ? { branchId: defaultClass.branchId } : undefined),
    defaultClass ? getTodayAttendance(defaultClass.id) : Promise.resolve([]),
  ]);

  const classStudents = students.filter((s) => s.classId === defaultClass?.id);

  return (
    <>
      <PageHeader
        title="Daily Attendance"
        subtitle={defaultClass ? `${defaultClass.name} — Today` : "Select a class"}
        action={{ label: "View Summary", href: "/attendance/summary" }}
      />
      <AttendanceGrid
        students={classStudents.length > 0 ? classStudents : students.slice(0, 6)}
        initialRecords={attendance}
      />
      <div className="mt-4">
        <Button variant="link" asChild>
          <Link href="/attendance/summary">Monthly summary →</Link>
        </Button>
      </div>
    </>
  );
}
