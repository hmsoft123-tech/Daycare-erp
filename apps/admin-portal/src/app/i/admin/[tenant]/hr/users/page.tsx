import { PageHeader } from "@/components/layout/PageHeader";
import { BranchStaffAccounts } from "@/components/hr/BranchStaffAccounts";

export default function UserAccountsPage() {
  return (
    <>
      <PageHeader
        title="User Accounts"
        subtitle="Create login accounts for teachers, front desk, accountants and branch admins"
      />
      <BranchStaffAccounts />
    </>
  );
}
