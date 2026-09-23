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
  getTherapySessions,
  getStudentCurrentAttendance,
  getHealthRecords,
} from "@/lib/mock-service";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  const [parents, notes, medicalIncidents, attendance, therapySessions, currentAttendance, healthRecords] =
    await Promise.all([
    getParentsByIds(student.parentIds),
    getStudentNotes(id),
    getMedicalIncidents(id),
    getStudentAttendance(id),
    getTherapySessions(id),
    getStudentCurrentAttendance(id),
    getHealthRecords({ subject: "student", personId: id }),
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
        therapySessions={therapySessions}
        currentAttendance={currentAttendance}
        healthRecords={healthRecords}
      />
    </>
  );
}
