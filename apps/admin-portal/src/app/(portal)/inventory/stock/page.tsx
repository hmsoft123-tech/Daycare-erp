import { PageHeader } from "@/components/layout/PageHeader";
import { StockLevelsClient } from "@/components/inventory/StockLevelsClient";
import { getInventoryItems, getStockLevels } from "@/lib/mock-service";

export default async function InventoryStockPage() {
  const [levels, items] = await Promise.all([getStockLevels(), getInventoryItems()]);

  return (
    <>
      <PageHeader
        title="Branch stock"
        subtitle="Categorised like Purchase Requisitions · filter by branch, category, sub-category, supplier and stock status"
      />
      <StockLevelsClient levels={levels} items={items} />
    </>
  );
}
