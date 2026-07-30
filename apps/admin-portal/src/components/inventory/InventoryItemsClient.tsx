"use client";

import { useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddInventoryItemModal } from "@/components/inventory/AddInventoryItemModal";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "@/types";

type Props = {
  items: InventoryItem[];
};

const categoryLabel: Record<InventoryItem["category"], string> = {
  supplies: "Supplies",
  food: "Food",
  cleaning: "Cleaning",
  therapy: "Therapy",
  playground: "Playground",
  other: "Other",
};

export function InventoryItemsClient({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(query) ||
        i.sku.toLowerCase().includes(query) ||
        i.category.includes(query)
    );
  }, [items, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search SKU, name, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" onClick={() => setAddOpen(true)}>
          <PackagePlus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-[#F1F3F5] bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">SKU</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Item</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Category</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Unit</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Reorder</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Unit cost</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-[#F1F3F5] last:border-0 hover:bg-[#F9FAFB]">
                <td className="px-4 py-3.5 font-mono text-xs text-muted">{item.sku}</td>
                <td className="px-4 py-3.5 font-medium text-heading">{item.name}</td>
                <td className="px-4 py-3.5 capitalize text-muted">{categoryLabel[item.category]}</td>
                <td className="px-4 py-3.5 text-muted">{item.unit}</td>
                <td className="px-4 py-3.5 text-right text-heading">{item.reorderLevel}</td>
                <td className="px-4 py-3.5 text-right text-heading">{formatCurrency(item.unitCost)}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={item.active ? "success" : "secondary"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
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
