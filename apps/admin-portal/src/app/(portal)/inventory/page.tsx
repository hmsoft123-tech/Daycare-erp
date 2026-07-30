import { PageHeader } from "@/components/layout/PageHeader";
import { ProcurementInbox } from "@/components/inventory/ProcurementInbox";
import { getInventoryItems, getPurchaseRequisitions } from "@/lib/mock-service";

export default async function InventoryPage() {
  const [requisitions, catalog] = await Promise.all([
    getPurchaseRequisitions(),
    getInventoryItems(),
  ]);

  return (
    <>
      <PageHeader
        title="Purchase requisitions"
        subtitle="Create requests, approve, and receive catalog items into stock"
      />
      <ProcurementInbox requisitions={requisitions} catalog={catalog} />
    </>
  );
}
