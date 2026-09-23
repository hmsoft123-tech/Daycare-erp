"use client";

import { useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddInventoryItemModal } from "@/components/inventory/AddInventoryItemModal";
import { LastUpdated } from "@/components/common/LastUpdated";
import { ITEM_TYPE_LABEL, STOCK_CATEGORIES, categoryLabel } from "@/lib/stock-categories";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "@/types";

type Props = {
  items: InventoryItem[];
};

export function InventoryItemsClient({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  /** "course" = anything used by a Course Outline (books / copies / kits) */
  const [category, setCategory] = useState<string>("course");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((i) => {
      if (category === "course" && i.itemType !== "course_material") return false;
      if (category !== "all" && category !== "course" && i.category !== category) return false;
      if (!query) return true;
      return (
        i.name.toLowerCase().includes(query) ||
        i.sku.toLowerCase().includes(query) ||
        categoryLabel(i.category).toLowerCase().includes(query) ||
        (i.subCategory?.toLowerCase().includes(query) ?? false) ||
        (i.supplier?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [items, q, category]);

  const chips = [
    { id: "course", label: "Course materials" },
    { id: "all", label: "All items" },
    ...STOCK_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            placeholder="Search SKU, name, category, supplier…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  category === c.id ? "bg-brand-500 text-white" : "bg-bg text-muted hover:text-heading"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <PackagePlus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-border bg-bg">
            <tr>
              {["SKU", "Item", "Category", "Type", "Supplier", "Unit", "Reorder", "Unit cost", "Status", "Last updated"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted ${
                      h === "Reorder" || h === "Unit cost" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3.5 font-mono text-xs text-muted">{item.sku}</td>
                <td className="px-4 py-3.5 font-medium text-heading">{item.name}</td>
                <td className="px-4 py-3.5">
                  <p className="text-heading">{categoryLabel(item.category)}</p>
                  {item.subCategory && <p className="text-[11px] text-muted">{item.subCategory}</p>}
                </td>
                <td className="px-4 py-3.5 text-muted">{ITEM_TYPE_LABEL[item.itemType]}</td>
                <td className="px-4 py-3.5 text-muted">{item.supplier ?? "—"}</td>
                <td className="px-4 py-3.5 text-muted">{item.unit}</td>
                <td className="px-4 py-3.5 text-right text-heading">{item.reorderLevel}</td>
                <td className="px-4 py-3.5 text-right text-heading">{formatCurrency(item.unitCost)}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={item.active ? "success" : "secondary"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <LastUpdated stamp={item.lastUpdated} variant="compact" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddInventoryItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(item) => setItems((prev) => [item, ...prev])}
      />
    </div>
  );
}
