import { PageHeader } from "@/components/layout/PageHeader";
import { VirtualStudentTable } from "@/components/students/VirtualStudentTable";
import { getStudents } from "@/lib/mock-service";
import { StudentsPageActions } from "./StudentsPageActions";

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <>
      <PageHeader title="Students" subtitle="Manage enrolled students across all programs">
        <StudentsPageActions />
      </PageHeader>
      <VirtualStudentTable students={students} />
    </>
  );
}
