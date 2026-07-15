"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PurchaseRequisition, PRStatus } from "@/types";
import { Check, X, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProcurementInboxProps {
  requisitions: PurchaseRequisition[];
}

const statusVariant: Record<PRStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function ProcurementInbox({ requisitions }: ProcurementInboxProps) {
  const branchId = useBranchFilter();
  const [items, setItems] = useState(requisitions);
  const filtered = branchId ? items.filter((r) => r.branchId === branchId) : items;

  const handleAction = (id: string, status: PRStatus) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Requisition ${status}`);
  };

  return (
    <div className="space-y-4">
      {filtered.map((pr) => (
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
                  Requested by {pr.requestedBy} · {formatDate(pr.date)}
                </p>
                {pr.vendor && <p className="text-xs text-gray-400">Vendor: {pr.vendor}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(pr.totalAmount)}</p>
                <Badge variant={statusVariant[pr.status]} className="mt-1 capitalize">{pr.status}</Badge>
              </div>
              {pr.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleAction(pr.id, "approved")}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(pr.id, "rejected")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
