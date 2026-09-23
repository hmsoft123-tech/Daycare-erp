import { PageHeader } from "@/components/layout/PageHeader";
import { SpecialProgramsHub } from "@/components/programs/SpecialProgramsHub";
import {
  getParentsByIds,
  getProgramRegistrations,
  getSpecialPrograms,
  getStudents,
} from "@/lib/mock-service";

export default async function SpecialProgramsPage() {
  const [programs, registrations, students] = await Promise.all([
    getSpecialPrograms(),
    getProgramRegistrations(),
    getStudents(),
  ]);
  const parents = await getParentsByIds(Array.from(new Set(students.flatMap((s) => s.parentIds))));

  return (
    <>
      <PageHeader
        title="Special Programs & Activities"
        subtitle="Summer & winter camps · field trips · workshops · events — SDLC and outside children"
      />
      <SpecialProgramsHub programs={programs} registrations={registrations} students={students} parents={parents} />
    </>
  );
}
