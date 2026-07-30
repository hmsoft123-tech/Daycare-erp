"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { branches } from "@/data/branches";
import { formatDate } from "@/lib/utils";
import type { InventoryItem, StockLevel } from "@/types";

type Props = {
  levels: StockLevel[];
  items: InventoryItem[];
};

export function StockLevelsClient({ levels: initial, items }: Props) {
  const branchId = useBranchFilter();
  const [levels, setLevels] = useState(initial);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [focus, setFocus] = useState<{ itemId?: string; branchId?: string }>({});

  const itemMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items]
  );

  const rows = useMemo(() => {
    const filtered = branchId ? levels.filter((l) => l.branchId === branchId) : levels;
    return filtered
      .map((l) => {
        const item = itemMap[l.itemId];
        const low = item ? l.qtyOnHand <= item.reorderLevel : false;
        return { level: l, item, low };
      })
      .filter((r) => r.item)
      .sort((a, b) => Number(b.low) - Number(a.low));
  }, [levels, branchId, itemMap]);

  const lowCount = rows.filter((r) => r.low).length;

  const onAdjusted = (level: StockLevel) => {
    setLevels((prev) => {
      const idx = prev.findIndex(
        (p) => p.itemId === level.itemId && p.branchId === level.branchId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = level;
        return next;
      }
      return [level, ...prev];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {lowCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {lowCount} item(s) at or below reorder level
            </span>
          ) : (
            "All stocked items are above reorder level for this view."
          )}
        </p>
        <Button
          type="button"
          onClick={() => {
            setFocus({});
            setAdjustOpen(true);
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Adjust stock
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-[#F1F3F5] bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Item</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Branch</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">On hand</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Reorder at</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">Updated</th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ level, item, low }) => (
              <tr key={level.id} className="border-b border-[#F1F3F5] last:border-0 hover:bg-[#F9FAFB]">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-heading">{item!.name}</p>
                  <p className="font-mono text-[11px] text-muted">{item!.sku}</p>
                </td>
                <td className="px-4 py-3.5 text-muted">
                  {branches.find((b) => b.id === level.branchId)?.name.replace(" Campus", "")}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={low ? "font-bold text-amber-700" : "font-semibold text-heading"}>
                    {level.qtyOnHand}
                  </span>
                  <span className="text-muted"> {item!.unit}</span>
                  {low && (
                    <Badge variant="warning" className="ml-2">Low</Badge>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right text-muted">{item!.reorderLevel}</td>
                <td className="px-4 py-3.5 text-muted">{formatDate(level.updatedAt)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFocus({ itemId: level.itemId, branchId: level.branchId });
                      setAdjustOpen(true);
                    }}
                  >
                    Adjust
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  No stock records yet. Adjust stock to create a branch balance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdjustStockModal
        open={adjustOpen}
        items={items}
        initial={focus}
        onClose={() => setAdjustOpen(false)}
        onAdjusted={onAdjusted}
      />
    </div>
  );
}
