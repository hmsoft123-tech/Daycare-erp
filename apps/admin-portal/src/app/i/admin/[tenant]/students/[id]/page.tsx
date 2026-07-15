import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentProfile } from "@/components/students/StudentProfile";
import { Button } from "@/components/ui/button";
import {
  getStudentById,
  getParentsByIds,
  getStudentNotes,
  getMedicalIncidents,
  getStudentAttendance,
} from "@/lib/mock-service";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const [parents, notes, medicalIncidents, attendance] = await Promise.all([
    getParentsByIds(student.parentIds),
    getStudentNotes(id),
    getMedicalIncidents(id),
    getStudentAttendance(id),
  ]);

  return (
    <>
      <PageHeader title={`${student.firstName} ${student.lastName}`} subtitle={student.className}>
        <Button variant="outline" asChild>
          <Link href="/students">← All Students</Link>
        </Button>
      </PageHeader>
      <StudentProfile
        student={student}
        parents={parents}
        notes={notes}
        medicalIncidents={medicalIncidents}
        attendance={attendance}
      />
    </>
  );
}
