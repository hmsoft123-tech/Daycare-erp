import { PageHeader } from "@/components/layout/PageHeader";
import { StudentTable } from "@/components/students/StudentTable";
import { getStudents } from "@/lib/mock-service";

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <>
      <PageHeader title="Students" subtitle="Manage enrolled students across all programs" />
      <StudentTable students={students} />
    </>
  );
}
