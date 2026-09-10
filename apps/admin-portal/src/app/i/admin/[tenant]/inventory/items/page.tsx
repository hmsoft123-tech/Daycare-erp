import { PageHeader } from "@/components/layout/PageHeader";
import { InventoryItemsClient } from "@/components/inventory/InventoryItemsClient";
import { CourseInventoryOps } from "@/components/inventory/CourseInventoryOps";
import { getInventoryItems } from "@/lib/mock-service";

export default async function InventoryItemsPage() {
  const items = await getInventoryItems();

  return (
    <>
      <PageHeader
        title="Course inventory"
        subtitle="Course books · copies · workbooks · stationery · sales & valuation"
      />
      <div className="space-y-6">
        <CourseInventoryOps items={items} />
        <InventoryItemsClient items={items} />
      </div>
    </>
  );
}
