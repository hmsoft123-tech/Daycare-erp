"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "@/types";

type Props = {
  items: InventoryItem[];
};

type SaleRow = {
  id: string;
  sku: string;
  name: string;
  classLabel: string;
  branch: string;
  qty: number;
  amount: number;
  type: "sale" | "return" | "damaged";
};

const DEMO_MOVES: SaleRow[] = [
  {
    id: "m1",
    sku: "BK-ENG-01",
    name: "Phonics workbook A",
    classLabel: "Nursery A",
    branch: "North Nazimabad",
    qty: 12,
    amount: 8400,
    type: "sale",
  },
  {
    id: "m2",
    sku: "CP-MATH-02",
    name: "Math copy pack",
    classLabel: "KG B",
    branch: "Clifton",
    qty: 8,
    amount: 3200,
    type: "sale",
  },
  {
    id: "m3",
    sku: "ST-SET-01",
    name: "Course stationery kit",
    classLabel: "Toddler",
    branch: "North Nazimabad",
    qty: 2,
    amount: 900,
    type: "return",
  },
  {
    id: "m4",
    sku: "BK-URD-03",
    name: "Urdu reader L1",
    classLabel: "Pre-Nursery",
    branch: "DHA",
    qty: 1,
    amount: 450,
    type: "damaged",
  },
];

export function CourseInventoryOps({ items }: Props) {
  const [tab, setTab] = useState<"sales" | "returns" | "valuation" | "reports">("sales");
  const [classFilter, setClassFilter] = useState("");

  const courseItems = useMemo(
    () =>
      items.filter((i) =>
        ["books", "courses", "stationery", "printed"].includes(i.category)
      ),
    [items]
  );

  const valuation = useMemo(() => {
    const totalCost = courseItems.reduce((s, i) => s + i.unitCost * Math.max(i.reorderLevel, 1), 0);
    const skus = courseItems.length;
    return { totalCost, skus, low: Math.min(3, skus) };
  }, [courseItems]);

  const moves = useMemo(() => {
    const q = classFilter.trim().toLowerCase();
    return DEMO_MOVES.filter((m) => {
      if (tab === "sales" && m.type !== "sale") return false;
      if (tab === "returns" && m.type !== "return" && m.type !== "damaged") return false;
      if (!q) return true;
      return (
        m.classLabel.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      );
    });
  }, [tab, classFilter]);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div>
        <h2 className="text-sm font-semibold text-heading">Course inventory operations</h2>
        <p className="text-xs text-muted">
          Books · copies · workbooks · course stationery · sales / returns / valuation (FE review)
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["sales", "Sales to students"],
            ["returns", "Returns / damaged"],
            ["valuation", "Stock valuation"],
            ["reports", "Course reports"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === id ? "bg-brand-500 text-white" : "bg-bg text-muted hover:text-heading"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === "sales" || tab === "returns") && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Filter class, branch, item…"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={() =>
                toast.success(
                  tab === "sales"
                    ? "Sale recorded · class & branch wise (demo)"
                    : "Return / damage logged (demo)"
                )
              }
            >
              {tab === "sales" ? "Record sale" : "Log return"}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">SKU</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Item</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Class</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Branch</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted">Qty</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Type</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{m.sku}</td>
                    <td className="px-3 py-2.5 font-medium text-heading">{m.name}</td>
                    <td className="px-3 py-2.5 text-muted">{m.classLabel}</td>
                    <td className="px-3 py-2.5 text-muted">{m.branch}</td>
                    <td className="px-3 py-2.5 text-right">{m.qty}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(m.amount)}</td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={
                          m.type === "sale" ? "success" : m.type === "return" ? "secondary" : "danger"
                        }
                      >
                        {m.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {moves.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted">
                      No movements match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "valuation" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted">Course SKUs</p>
              <p className="mt-1 font-heading text-2xl font-bold">{valuation.skus}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted">Est. stock value</p>
              <p className="mt-1 font-heading text-2xl font-bold">
                {formatCurrency(valuation.totalCost)}
              </p>
              <p className="text-[10px] text-muted">Demo · unit cost × reorder proxy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted">Low stock alerts</p>
              <p className="mt-1 font-heading text-2xl font-bold text-amber-600">{valuation.low}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Stock list",
            "Opening stock",
            "Stock in / out",
            "Sales by class & branch",
            "Returns & damaged",
            "Current stock",
            "Low stock alerts",
            "Valuation summary",
          ].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toast.success(`${r} · exported (demo)`)}
              className="rounded-xl border border-border bg-bg px-3 py-3 text-left text-sm font-semibold text-heading transition hover:border-brand-200"
            >
              {r}
              <span className="mt-1 block text-[11px] font-normal text-muted">Export CSV / PDF</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
