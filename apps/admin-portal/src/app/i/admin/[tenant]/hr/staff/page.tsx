import { PageHeader } from "@/components/layout/PageHeader";
import { StaffDirectory } from "@/components/hr/StaffDirectory";
import { getStaff } from "@/lib/mock-service";

export default async function StaffPage() {
  const staff = await getStaff();

  return (
    <>
      <PageHeader title="Staff Directory" subtitle="Teachers, therapists, and support staff" />
      <StaffDirectory staff={staff} />
    </>
  );
}
