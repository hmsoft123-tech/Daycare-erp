import { PageHeader } from "@/components/layout/PageHeader";
import { VirtualStudentTable } from "@/components/students/VirtualStudentTable";
import {
  SCHOOL_ATTENDANCE_TODAY,
  getCurrentAttendance,
  getParentsByIds,
  getStudents,
} from "@/lib/mock-service";

export default async function StudentsPage() {
  const students = await getStudents();
  const [parents, attendance] = await Promise.all([
    getParentsByIds(Array.from(new Set(students.flatMap((s) => s.parentIds)))),
    getCurrentAttendance(),
  ]);

  return (
    <>
      <PageHeader title="Students" subtitle="Manage enrolled students across all programs" />
      <VirtualStudentTable
        students={students}
        parents={parents}
        attendance={attendance}
        attendanceDate={SCHOOL_ATTENDANCE_TODAY}
      />
    </>
  );
}
