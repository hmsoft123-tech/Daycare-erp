"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { advancePurchaseRequisition } from "@/lib/mock-service";
import { useUIStore } from "@/lib/store";
import {
  PR_STATUS_BADGE,
  PR_STATUS_LABEL,
  REQUISITION_KINDS,
  lineAmount,
  nextProcurementAction,
  requisitionTotal,
} from "@/lib/procurement";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PRLineItem, PurchaseRequisition } from "@/types";
import { toast } from "sonner";

type Props = {
  initial: PurchaseRequisition;
  branchName?: string;
};

export function RequisitionDetailClient({ initial, branchName }: Props) {
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";
  const [pr, setPr] = useState(initial);
  const [lines, setLines] = useState<PRLineItem[]>(initial.items);
  const [vendor, setVendor] = useState(initial.vendor ?? "");
  const [deliveryDate, setDeliveryDate] = useState(initial.deliveryDate ?? "");
  const [hoNotes, setHoNotes] = useState(initial.hoNotes ?? "");
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => requisitionTotal(lines), [lines]);
  const next = nextProcurementAction(pr.status);
  const kindLabel = REQUISITION_KINDS.find((k) => k.value === pr.kind)?.label ?? pr.kind;
  const canEditPrices = isHeadOffice && (pr.status === "pending" || pr.status === "approved");
  const canAdvance =
    next &&
    ((next.hoOnly && isHeadOffice) || (!next.hoOnly && true));

  const apply = async (status: PurchaseRequisition["status"]) => {
    setBusy(true);
    const result = await advancePurchaseRequisition(pr.id, status, {
      items: canEditPrices ? lines : undefined,
      vendor: vendor.trim() || undefined,
      deliveryDate: deliveryDate || undefined,
      hoNotes: hoNotes.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPr(result.pr);
    setLines(result.pr.items);
    toast.success(PR_STATUS_LABEL[result.pr.status]);
  };

  return (
    <>
      <PageHeader
        title={pr.summary}
        subtitle={`${kindLabel}${pr.forMonth ? ` · ${pr.forMonth}` : ""} · ${pr.requestedBy}`}
      >
        <Badge variant={PR_STATUS_BADGE[pr.status]}>{PR_STATUS_LABEL[pr.status]}</Badge>
      </PageHeader>

      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-heading">
        <span className="font-semibold">HO procurement: </span>
        Request → enter per-item amounts &amp; generate bill → pay bill → dispatch → receive at branch (stock updated).
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Brand</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2 text-right">Amount / unit</th>
                  <th className="pb-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((item, idx) => (
                  <tr key={item.id} className="border-b align-top">
                    <td className="py-3">
                      <p className="font-medium">{item.item}</p>
                      {item.remarks && <p className="text-xs text-muted">{item.remarks}</p>}
                    </td>
                    <td className="py-3 text-muted">{item.brand ?? "—"}</td>
                    <td className="py-3">
                      {canEditPrices ? (
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={item.qty}
                          onChange={(e) => {
                            const qty = Number(e.target.value);
                            setLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, qty: qty || 0 } : l))
                            );
                          }}
                        />
                      ) : (
                        item.qty
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {canEditPrices ? (
                        <Input
                          type="number"
                          min={0}
                          className="ml-auto w-28 text-right"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const unitPrice = Number(e.target.value);
                            setLines((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, unitPrice: Number.isNaN(unitPrice) ? 0 : unitPrice } : l
                              )
                            );
                          }}
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(lineAmount(item.qty, item.unitPrice))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-3 text-right font-semibold">
                    Bill total
                  </td>
                  <td className="pt-3 text-right font-bold">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>

            {canEditPrices && (
              <div className="grid gap-3 rounded-xl bg-bg p-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    className="mt-1"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery">Delivery date (HO)</Label>
                  <Input
                    id="delivery"
                    type="date"
                    className="mt-1"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">HO notes</Label>
                  <Textarea
                    id="notes"
                    className="mt-1"
                    rows={2}
                    value={hoNotes}
                    onChange={(e) => setHoNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Procurement details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Branch</span>
              <span>{branchName ?? pr.branchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PR date</span>
              <span>{formatDate(pr.date)}</span>
            </div>
            {pr.billNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Bill #</span>
                <span className="font-mono text-xs">{pr.billNumber}</span>
              </div>
            )}
            {pr.vendor && (
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor</span>
                <span>{pr.vendor}</span>
              </div>
            )}
            {pr.deliveryDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span>{formatDate(pr.deliveryDate)}</span>
              </div>
            )}
            {pr.billedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Billed</span>
                <span>{formatDate(pr.billedAt)}</span>
              </div>
            )}
            {pr.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span>{formatDate(pr.paidAt)}</span>
              </div>
            )}
            {pr.dispatchedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Dispatched</span>
                <span>{formatDate(pr.dispatchedAt)}</span>
              </div>
            )}
            {pr.receivedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Received</span>
                <span>{formatDate(pr.receivedAt)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(pr.status === "pending" ? total : pr.totalAmount)}</span>
            </div>
            {pr.hoNotes && <p className="rounded-xl bg-bg p-3 text-xs text-muted">{pr.hoNotes}</p>}

            <div className="space-y-2 pt-2">
              {canEditPrices && isHeadOffice && (
                <>
                  <Button className="w-full" disabled={busy} onClick={() => apply("billed")}>
                    Enter amounts &amp; generate bill
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={busy}
                    onClick={() => apply("rejected")}
                  >
                    Reject requisition
                  </Button>
                </>
              )}
              {canAdvance && next && next.action !== "billed" && (
                <Button className="w-full" disabled={busy} onClick={() => apply(next.action)}>
                  {next.label}
                </Button>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link href="/inventory">← Back to requisitions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
