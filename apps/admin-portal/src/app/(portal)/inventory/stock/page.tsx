import { PageHeader } from "@/components/layout/PageHeader";
import { StockLevelsClient } from "@/components/inventory/StockLevelsClient";
import { getInventoryItems, getStockLevels } from "@/lib/mock-service";

export default async function InventoryStockPage() {
  const [levels, items] = await Promise.all([getStockLevels(), getInventoryItems()]);

  return (
    <>
      <PageHeader
        title="Stock levels"
        subtitle="On-hand quantities by branch · low stock highlighted at reorder level"
      />
      <StockLevelsClient levels={levels} items={items} />
    </>
  );
}
