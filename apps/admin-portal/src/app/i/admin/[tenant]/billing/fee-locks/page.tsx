import { PageHeader } from "@/components/layout/PageHeader";
import { FeeLockInbox } from "@/components/billing/FeeLockInbox";
import { getFeeLockRequests } from "@/lib/mock-service";

export default async function TenantFeeLocksPage() {
  const requests = await getFeeLockRequests();

  return (
    <>
      <PageHeader
        title="Fee lock approvals"
        subtitle="Head Office must approve before a student becomes pending payment"
      />
      <FeeLockInbox requests={requests} />
    </>
  );
}
