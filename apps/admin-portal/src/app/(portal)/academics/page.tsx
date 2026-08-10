import { PageHeader } from "@/components/layout/PageHeader";
import { AcademicsManager } from "@/components/academics/AcademicsManager";
import {
  getParentSchoolAssignments,
  getParentSchoolAttendance,
  getParentSchoolHomework,
  getParentSchoolNotices,
  getParentSchoolProgress,
  getParentSchoolSyllabus,
  getStudents,
} from "@/lib/mock-service";

export default async function AcademicsPage() {
  const [students, attendance, homework, assignments, progress, notices, syllabus] =
    await Promise.all([
      getStudents(),
      getParentSchoolAttendance(),
      getParentSchoolHomework(),
      getParentSchoolAssignments(),
      getParentSchoolProgress(),
      getParentSchoolNotices(),
      getParentSchoolSyllabus(),
    ]);

  return (
    <>
      <PageHeader
        title="Academics"
        subtitle="Publish attendance, homework, assignments, progress reports, notices & syllabus to the parent portal"
        action={{ label: "Daily Attendance", href: "/attendance" }}
      />
      <AcademicsManager
        students={students}
        attendance={attendance}
        homework={homework}
        assignments={assignments}
        progress={progress}
        notices={notices}
        syllabus={syllabus}
      />
    </>
  );
}
