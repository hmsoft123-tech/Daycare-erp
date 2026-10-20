import { PageHeader } from "@/components/layout/PageHeader";
import { FeeApprovalQueue } from "@/components/admissions/FeeApprovalQueue";

export default function CompanyFeeApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Company Fee Approval"
        subtitle="Branch-approved fees · approving locks the fees, issues the challan and emails the parent the enrollment form"
      />
      <FeeApprovalQueue level="company" />
    </>
  );
}
