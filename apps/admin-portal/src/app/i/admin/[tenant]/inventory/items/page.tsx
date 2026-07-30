import { PageHeader } from "@/components/layout/PageHeader";
import { InventoryItemsClient } from "@/components/inventory/InventoryItemsClient";
import { getInventoryItems } from "@/lib/mock-service";

export default async function InventoryItemsPage() {
  const items = await getInventoryItems();

  return (
    <>
      <PageHeader
        title="Inventory items"
        subtitle="Catalog of supplies, food, cleaning, therapy, and playground materials"
      />
      <InventoryItemsClient items={items} />
    </>
  );
}
