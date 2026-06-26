import { PageHeader } from "@/components/layout/PageHeader";
import { ProcurementInbox } from "@/components/inventory/ProcurementInbox";
import { getPurchaseRequisitions } from "@/lib/mock-service";

export default async function InventoryPage() {
  const requisitions = await getPurchaseRequisitions();

  return (
    <>
      <PageHeader title="Procurement Inbox" subtitle="Review and approve purchase requisitions" />
      <ProcurementInbox requisitions={requisitions} />
    </>
  );
}
