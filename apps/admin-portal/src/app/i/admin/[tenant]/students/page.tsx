import { PageHeader } from "@/components/layout/PageHeader";
import { ApiStudentsList } from "@/components/students/ApiStudentsList";
import { StudentsPageActions } from "./StudentsPageActions";

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="Students" subtitle="Manage enrolled students across all programs">
        <StudentsPageActions />
      </PageHeader>
      <ApiStudentsList />
    </>
  );
}
