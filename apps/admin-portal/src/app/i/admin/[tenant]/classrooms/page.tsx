import { PageHeader } from "@/components/layout/PageHeader";
import { ClassroomsListClient } from "@/components/classrooms/ClassroomsListClient";
import { getClasses, getStaff, getStudents } from "@/lib/mock-service";

export default async function ClassroomsPage() {
  const [classrooms, students, staff] = await Promise.all([
    getClasses(),
    getStudents(),
    getStaff(),
  ]);

  return (
    <>
      <PageHeader
        title="Classrooms"
        subtitle="Branch classrooms · student roster · teacher assignment · parent-visible activity logs"
      />
      <ClassroomsListClient classrooms={classrooms} students={students} staff={staff} />
    </>
  );
}
