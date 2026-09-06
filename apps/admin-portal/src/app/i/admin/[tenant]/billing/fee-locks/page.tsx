import { PageHeader } from "@/components/layout/PageHeader";
import { FeeLockInbox } from "@/components/billing/FeeLockInbox";
import { getFeeLockRequests } from "@/lib/mock-service";

export default async function FeeLocksPage() {
  const requests = await getFeeLockRequests();

  return (
    <>
      <PageHeader
        title="HO Fee / Discount Approvals"
        subtitle="Pre-programmed fee plans apply automatically · discounts & exceptions need Head Office only"
      />
      <FeeLockInbox requests={requests} />
    </>
  );
}
