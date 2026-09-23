"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { LastUpdated } from "@/components/common/LastUpdated";
import {
  FilterInput,
  FilterSelect,
  RangeFilter,
  SortControl,
  SortHeader,
  compareValues,
  type SortDir,
} from "@/components/common/FilterControls";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { branches } from "@/data/branches";
import {
  ITEM_TYPE_LABEL,
  STOCKED_CATEGORIES,
  STOCK_STATUS_LABEL,
  categoryLabel,
  stockStatus,
  subCategoriesFor,
  type StockStatus,
} from "@/lib/stock-categories";
import { cn } from "@/lib/utils";
import type { InventoryCategory, InventoryItem, InventoryItemType, StockLevel } from "@/types";

type Props = {
  levels: StockLevel[];
  items: InventoryItem[];
};

type SortKey = "item" | "category" | "branch" | "qty" | "status" | "updated" | "supplier";

const STATUS_RANK: Record<StockStatus, number> = { out: 0, low: 1, in_stock: 2 };
const STATUS_BADGE: Record<StockStatus, "danger" | "warning" | "success"> = {
  out: "danger",
  low: "warning",
  in_stock: "success",
};

const branchName = (id: string) => branches.find((b) => b.id === id)?.name.replace(" Campus", "") ?? id;

export function StockLevelsClient({ levels: initial, items }: Props) {
  const contextBranch = useBranchFilter();
  const [levels, setLevels] = useState(initial);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [focus, setFocus] = useState<{ itemId?: string; branchId?: string }>({});

  const [branch, setBranch] = useState<string>(contextBranch ?? "all");
  const [category, setCategory] = useState<InventoryCategory | "all">("all");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [itemQuery, setItemQuery] = useState("");
  const [status, setStatus] = useState<StockStatus | "all">("all");
  const [qtyMin, setQtyMin] = useState("");
  const [qtyMax, setQtyMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplier, setSupplier] = useState<string>("all");
  const [itemType, setItemType] = useState<InventoryItemType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [dir, setDir] = useState<SortDir>("asc");

  // Follow the header branch switcher
  useEffect(() => setBranch(contextBranch ?? "all"), [contextBranch]);

  const itemMap = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const suppliers = useMemo(
    () => Array.from(new Set(items.map((i) => i.supplier).filter((s): s is string => !!s))).sort(),
    [items]
  );

  const allRows = useMemo(
    () =>
      levels
        .map((level) => {
          const item = itemMap[level.itemId];
          return item ? { level, item, status: stockStatus(level.qtyOnHand, item.reorderLevel) } : null;
        })
        .filter((r): r is { level: StockLevel; item: InventoryItem; status: StockStatus } => !!r),
    [levels, itemMap]
  );

  // Rows in the chosen branch only — drives the category summary
  const branchRows = useMemo(
    () => (branch === "all" ? allRows : allRows.filter((r) => r.level.branchId === branch)),
    [allRows, branch]
  );

  const rows = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    const min = qtyMin === "" ? undefined : Number(qtyMin);
    const max = qtyMax === "" ? undefined : Number(qtyMax);
    return branchRows
      .filter(({ level, item, status: st }) => {
        if (category !== "all" && item.category !== category) return false;
        if (subCategory !== "all" && item.subCategory !== subCategory) return false;
        if (status !== "all" && st !== status) return false;
        if (supplier !== "all" && item.supplier !== supplier) return false;
        if (itemType !== "all" && item.itemType !== itemType) return false;
        if (min !== undefined && level.qtyOnHand < min) return false;
        if (max !== undefined && level.qtyOnHand > max) return false;
        const day = level.updatedAt.slice(0, 10);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        if (q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "item":
            return compareValues(a.item.name, b.item.name, dir);
          case "category":
            return compareValues(
              `${categoryLabel(a.item.category)} ${a.item.subCategory ?? ""}`,
              `${categoryLabel(b.item.category)} ${b.item.subCategory ?? ""}`,
              dir
            );
          case "branch":
            return compareValues(branchName(a.level.branchId), branchName(b.level.branchId), dir);
          case "qty":
            return compareValues(a.level.qtyOnHand, b.level.qtyOnHand, dir);
          case "supplier":
            return compareValues(a.item.supplier, b.item.supplier, dir);
          case "updated":
            return compareValues(a.level.updatedAt, b.level.updatedAt, dir);
          case "status":
          default:
            return compareValues(STATUS_RANK[a.status], STATUS_RANK[b.status], dir);
        }
      });
  }, [branchRows, category, subCategory, status, supplier, itemType, qtyMin, qtyMax, dateFrom, dateTo, itemQuery, sortKey, dir]);

  const summary = useMemo(
    () =>
      STOCKED_CATEGORIES.map((c) => {
        const inCat = branchRows.filter((r) => r.item.category === c.value);
        return {
          ...c,
          skus: inCat.length,
          low: inCat.filter((r) => r.status === "low").length,
          out: inCat.filter((r) => r.status === "out").length,
        };
      }).filter((c) => c.skus > 0),
    [branchRows]
  );

  const lowCount = branchRows.filter((r) => r.status === "low").length;
  const outCount = branchRows.filter((r) => r.status === "out").length;

  const resetFilters = () => {
    setBranch(contextBranch ?? "all");
    setCategory("all");
    setSubCategory("all");
    setItemQuery("");
    setStatus("all");
    setQtyMin("");
    setQtyMax("");
    setDateFrom("");
    setDateTo("");
    setSupplier("all");
    setItemType("all");
    setSortKey("status");
    setDir("asc");
  };

  const onAdjusted = (level: StockLevel) => {
    setLevels((prev) => {
      const idx = prev.findIndex((p) => p.itemId === level.itemId && p.branchId === level.branchId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...level };
        return next;
      }
      return [{ ...level }, ...prev];
    });
  };

  const onSort = (k: SortKey, d: SortDir) => {
    setSortKey(k);
    setDir(d);
  };

  return (
    <div className="space-y-4">
      {/* Status chips + action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus(status === "low" ? "all" : "low")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              status === "low" ? "bg-amber-500 text-white" : "bg-soft-yellow text-[#B76E00]"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Low stock · {lowCount}
          </button>
          <button
            type="button"
            onClick={() => setStatus(status === "out" ? "all" : "out")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              status === "out" ? "bg-danger text-white" : "bg-soft-red text-danger"
            )}
          >
            <PackageX className="h-3.5 w-3.5" />
            Out of stock · {outCount}
          </button>
        </div>
        <Button
          type="button"
          onClick={() => {
            setFocus({ branchId: branch === "all" ? undefined : branch });
            setAdjustOpen(true);
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Adjust stock
        </Button>
      </div>

      {/* Category summary (same headings as PR) */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {summary.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              setCategory(category === c.value ? "all" : c.value);
              setSubCategory("all");
            }}
            className={cn(
              "rounded-xl border bg-surface px-3 py-2.5 text-left transition hover:border-brand-300",
              category === c.value ? "border-brand-400 ring-1 ring-brand-200" : "border-border"
            )}
          >
            <p className="truncate text-xs font-semibold text-heading">{c.label}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {c.skus} item{c.skus === 1 ? "" : "s"}
              {c.low > 0 && <span className="text-[#B76E00]"> · {c.low} low</span>}
              {c.out > 0 && <span className="text-danger"> · {c.out} out</span>}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterSelect
          label="Branch"
          value={branch}
          onChange={setBranch}
          allLabel="All branches"
          options={branches.map((b) => ({ value: b.id, label: branchName(b.id) }))}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={(v) => {
            setCategory(v);
            setSubCategory("all");
          }}
          options={STOCKED_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <FilterSelect
          label="Sub-category"
          value={subCategory}
          onChange={setSubCategory}
          options={(category === "all"
            ? STOCKED_CATEGORIES.flatMap((c) => c.subCategories)
            : subCategoriesFor(category)
          ).map((s) => ({ value: s, label: s }))}
        />
        <FilterInput
          label="Item"
          placeholder="Name or SKU"
          value={itemQuery}
          onChange={(e) => setItemQuery(e.target.value)}
        />
        <FilterSelect
          label="Stock status"
          value={status}
          onChange={setStatus}
          options={(Object.keys(STOCK_STATUS_LABEL) as StockStatus[]).map((s) => ({
            value: s,
            label: STOCK_STATUS_LABEL[s],
          }))}
        />
        <FilterSelect
          label="Item type"
          value={itemType}
          onChange={setItemType}
          options={(Object.keys(ITEM_TYPE_LABEL) as InventoryItemType[])
            .filter((t) => t !== "non_stock")
            .map((t) => ({ value: t, label: ITEM_TYPE_LABEL[t] }))}
        />
        <FilterSelect
          label="Supplier"
          value={supplier}
          onChange={setSupplier}
          options={suppliers.map((s) => ({ value: s, label: s }))}
        />
        <RangeFilter
          label="Available quantity"
          type="number"
          from={qtyMin}
          to={qtyMax}
          onFrom={setQtyMin}
          onTo={setQtyMax}
        />
        <RangeFilter
          label="Last updated (date)"
          type="date"
          from={dateFrom}
          to={dateTo}
          onFrom={setDateFrom}
          onTo={setDateTo}
          className="lg:col-span-2"
        />
        <div className="lg:col-span-2">
          <SortControl
            sortKey={sortKey}
            dir={dir}
            onKey={setSortKey}
            onDir={setDir}
            options={[
              { value: "status", label: "Stock status" },
              { value: "item", label: "Item" },
              { value: "category", label: "Category" },
              { value: "branch", label: "Branch" },
              { value: "qty", label: "Available quantity" },
              { value: "supplier", label: "Supplier" },
              { value: "updated", label: "Last updated" },
            ]}
          />
        </div>
        <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-6">
          <span className="text-xs text-muted">
            Showing {rows.length} of {branchRows.length} stock line{branchRows.length === 1 ? "" : "s"}
          </span>
          <button type="button" className="text-xs font-semibold text-brand-600" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="border-b border-border bg-bg text-xs font-semibold text-muted">
            <tr>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Item" column="item" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Category" column="category" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-left uppercase tracking-wider">Type</th>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Branch" column="branch" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Supplier" column="supplier" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-right"><SortHeader label="Available" column="qty" sortKey={sortKey} dir={dir} onSort={onSort} align="right" /></th>
              <th className="px-4 py-3.5 text-right uppercase tracking-wider">Reorder at</th>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Status" column="status" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-left"><SortHeader label="Last updated" column="updated" sortKey={sortKey} dir={dir} onSort={onSort} /></th>
              <th className="px-4 py-3.5 text-right uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ level, item, status: st }) => (
              <tr key={level.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-heading">{item.name}</p>
                  <p className="font-mono text-[11px] text-muted">{item.sku}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-heading">{categoryLabel(item.category)}</p>
                  {item.subCategory && <p className="text-[11px] text-muted">{item.subCategory}</p>}
                </td>
                <td className="px-4 py-3.5 text-muted">{ITEM_TYPE_LABEL[item.itemType]}</td>
                <td className="px-4 py-3.5 text-muted">{branchName(level.branchId)}</td>
                <td className="px-4 py-3.5 text-muted">{item.supplier ?? "—"}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={cn("font-semibold", st === "in_stock" ? "text-heading" : st === "low" ? "text-[#B76E00]" : "text-danger")}>
                    {level.qtyOnHand}
                  </span>
                  <span className="text-muted"> {item.unit}</span>
                </td>
                <td className="px-4 py-3.5 text-right text-muted">{item.reorderLevel}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={STATUS_BADGE[st]}>{STOCK_STATUS_LABEL[st]}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  <LastUpdated stamp={level} variant="compact" />
                </td>
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
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                  No stock lines match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdjustStockModal
        open={adjustOpen}
        items={items.filter((i) => i.itemType !== "non_stock")}
        initial={focus}
        onClose={() => setAdjustOpen(false)}
        onAdjusted={onAdjusted}
      />
    </div>
  );
}
