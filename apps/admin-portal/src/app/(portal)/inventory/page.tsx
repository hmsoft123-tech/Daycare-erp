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
        title="Procurement & requisitions"
        subtitle="Branch requests → HO prices & bills → pay → dispatch inventory to the branch"
      />
      <ProcurementInbox requisitions={requisitions} catalog={catalog} />
    </>
  );
}
