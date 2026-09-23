import { PageHeader } from "@/components/layout/PageHeader";
import { HealthSafetyHub } from "@/components/health/HealthSafetyHub";
import type { HealthPerson } from "@/components/health/HealthRecordModal";
import {
  getHealthRecords,
  getStaff,
  getStudents,
  getVaccinationCampaigns,
} from "@/lib/mock-service";

export default async function HealthSafetyPage() {
  const [records, campaigns, students, staff] = await Promise.all([
    getHealthRecords(),
    getVaccinationCampaigns(),
    getStudents({ status: "active" }),
    getStaff(),
  ]);

  const people: HealthPerson[] = [
    ...students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      branchId: s.branchId,
      subject: "student" as const,
      detail: s.grNumber ?? s.className,
    })),
    ...staff
      .filter((m) => m.status === "active")
      .map((m) => ({ id: m.id, name: m.name, branchId: m.branchId, subject: "staff" as const, detail: m.employeeId })),
  ];

  return (
    <>
      <PageHeader
        title="Health & Safety"
        subtitle="Students & staff · monthly hygiene · bi-annual health checks · vaccinations & campaigns · medical records"
      />
      <HealthSafetyHub records={records} campaigns={campaigns} people={people} />
    </>
  );
}
