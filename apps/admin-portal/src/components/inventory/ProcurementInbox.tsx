"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddRequisitionModal } from "@/components/inventory/AddRequisitionModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useUIStore } from "@/lib/store";
import { advancePurchaseRequisition } from "@/lib/mock-service";
import {
  PR_STATUS_BADGE,
  PR_STATUS_LABEL,
  REQUISITION_KINDS,
  nextProcurementAction,
} from "@/lib/procurement";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InventoryItem, PurchaseRequisition } from "@/types";
import { Package, ClipboardPlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProcurementInboxProps {
  requisitions: PurchaseRequisition[];
  catalog: InventoryItem[];
}

export function ProcurementInbox({ requisitions, catalog }: ProcurementInboxProps) {
  const branchId = useBranchFilter();
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";
  const [items, setItems] = useState(requisitions);
  const [addOpen, setAddOpen] = useState(false);
  const filtered = branchId ? items.filter((r) => r.branchId === branchId) : items;

  const runAdvance = async (pr: PurchaseRequisition, next: PurchaseRequisition["status"]) => {
    const result = await advancePurchaseRequisition(pr.id, next);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.map((r) => (r.id === pr.id ? result.pr : r)));
    toast.success(`${PR_STATUS_LABEL[result.pr.status]} · ${result.pr.billNumber ?? result.pr.summary}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {isHeadOffice
            ? "Head Office: price lines → generate bill → pay → dispatch inventory to the requesting branch."
            : "Submit requisitions for stationery, groceries, books, courses, or any inventory. HO manages billing & delivery."}
        </p>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <ClipboardPlus className="h-4 w-4" />
          New requisition
        </Button>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#DFE3E8] px-4 py-10 text-center text-sm text-muted">
          No requisitions for this view. Create one for inventory, books, courses, or SDLC catalogue items.
        </p>
      )}

      {filtered.map((pr) => {
        const next = nextProcurementAction(pr.status);
        const kindLabel = REQUISITION_KINDS.find((k) => k.value === pr.kind)?.label ?? pr.kind;
        const canAct =
          next &&
          ((next.hoOnly && isHeadOffice) ||
            (!next.hoOnly && (isHeadOffice || !branchId || branchId === pr.branchId)));

        return (
          <Card key={pr.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Package className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <Link href={`/inventory/${pr.id}`} className="font-medium text-brand-900 hover:underline">
                    {pr.summary}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {kindLabel}
                    {pr.forMonth ? ` · ${pr.forMonth}` : ""} · {pr.requestedBy} · {formatDate(pr.date)} ·{" "}
                    {pr.items.length} line(s)
                  </p>
                  {pr.billNumber && (
                    <p className="text-xs text-muted">
                      Bill {pr.billNumber}
                      {pr.vendor ? ` · ${pr.vendor}` : ""}
                    </p>
                  )}
                  {pr.deliveryDate && (
                    <p className="text-xs text-muted">Delivery {formatDate(pr.deliveryDate)}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(pr.totalAmount)}</p>
                  <Badge variant={PR_STATUS_BADGE[pr.status]} className="mt-1">
                    {PR_STATUS_LABEL[pr.status]}
                  </Badge>
                </div>
                {pr.status === "pending" && isHeadOffice && (
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/inventory/${pr.id}`}>
                        Price &amp; bill
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => runAdvance(pr, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {pr.status !== "pending" && canAct && next && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (next.action === "billed") {
                        window.location.href = `/inventory/${pr.id}`;
                        return;
                      }
                      runAdvance(pr, next.action);
                    }}
                  >
                    {next.label}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AddRequisitionModal
        open={addOpen}
        catalog={catalog}
        onClose={() => setAddOpen(false)}
        onCreated={(pr) => setItems((prev) => [pr, ...prev])}
      />
    </div>
  );
}
