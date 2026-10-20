import { PageHeader } from "@/components/layout/PageHeader";
import { StaffDirectory } from "@/components/hr/StaffDirectory";
import { BranchStaffAccounts } from "@/components/hr/BranchStaffAccounts";
import { Can } from "@/components/security/Can";
import { getStaff } from "@/lib/mock-service";

export default async function StaffPage() {
  const staff = await getStaff();

  return (
    <>
      <PageHeader title="Staff Directory" subtitle="Teachers, therapists, and support staff" />
      <Can capability="staff.accounts">
        <BranchStaffAccounts />
      </Can>
      <StaffDirectory staff={staff} />
    </>
  );
}
