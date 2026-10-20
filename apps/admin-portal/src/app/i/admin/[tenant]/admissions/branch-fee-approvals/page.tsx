import { PageHeader } from "@/components/layout/PageHeader";
import { FeeApprovalQueue } from "@/components/admissions/FeeApprovalQueue";

export default function BranchFeeApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Branch Fee Approval"
        subtitle="Fee packages proposed by staff · approve to send them to the company for the final lock"
      />
      <FeeApprovalQueue level="branch" />
    </>
  );
}
