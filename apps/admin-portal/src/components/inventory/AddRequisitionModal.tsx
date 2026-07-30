"use client";

import { useMemo, useState } from "react";
import { ClipboardPlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branches } from "@/data/branches";
import { createPurchaseRequisition } from "@/lib/mock-service";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem, PRLineItem, PurchaseRequisition } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  catalog: InventoryItem[];
  onClose: () => void;
  onCreated: (pr: PurchaseRequisition) => void;
};

type DraftLine = {
  key: string;
  itemId: string;
  qty: string;
};

export function AddRequisitionModal({ open, catalog, onClose, onCreated }: Props) {
  const activeCatalog = useMemo(() => catalog.filter((c) => c.active), [catalog]);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [requestedBy, setRequestedBy] = useState("");
  const [vendor, setVendor] = useState("");
  const [summary, setSummary] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { key: "l1", itemId: "", qty: "1" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setBranchId(branches[0]?.id ?? "");
    setRequestedBy("");
    setVendor("");
    setSummary("");
    setLines([{ key: "l1", itemId: "", qty: "1" }]);
    setErrors({});
  };

  const builtLines: PRLineItem[] = lines
    .map((l, idx) => {
      const item = activeCatalog.find((c) => c.id === l.itemId);
      if (!item) return null;
      const qty = Number(l.qty);
      if (!qty || qty <= 0) return null;
      return {
        id: `pri-new-${idx}-${Date.now()}`,
        itemId: item.id,
        item: item.name,
        qty,
        unitPrice: item.unitCost,
      };
    })
    .filter(Boolean) as PRLineItem[];

  const total = builtLines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (requestedBy.trim().length < 2) next.requestedBy = "Requester name required";
    if (summary.trim().length < 3) next.summary = "Summary required";
    if (!branchId) next.branchId = "Branch required";
    if (builtLines.length === 0) next.lines = "Add at least one catalog line with qty";
    setErrors(next);
    if (Object.keys(next).length) return;

    const pr = await createPurchaseRequisition({
      branchId,
      requestedBy: requestedBy.trim(),
      summary: summary.trim(),
      vendor: vendor.trim() || undefined,
      items: builtLines,
    });
    onCreated(pr);
    toast.success("Purchase requisition created");
    reset();
    onClose();
  };

  return (
    <ModalPortal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      maxWidth="max-w-xl"
    >
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <ClipboardPlus className="h-5 w-5 text-brand-500" />
            New purchase requisition
          </h2>
          <p className="mt-1 text-sm text-muted">Request catalog items for a branch.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reqBy">Requested by</Label>
            <Input id="reqBy" className="mt-1" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
            {errors.requestedBy && <p className="mt-1 text-xs text-danger">{errors.requestedBy}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Input id="summary" className="mt-1" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Monthly classroom supplies" />
          {errors.summary && <p className="mt-1 text-xs text-danger">{errors.summary}</p>}
        </div>
        <div>
          <Label htmlFor="vendor">Vendor (optional)</Label>
          <Input id="vendor" className="mt-1" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Line items</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setLines((prev) => [...prev, { key: `l-${Date.now()}`, itemId: "", qty: "1" }])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add line
            </Button>
          </div>
          {lines.map((line) => (
            <div key={line.key} className="grid gap-2 rounded-xl border border-[#F1F3F5] p-3 sm:grid-cols-[1fr_100px_auto]">
              <Select
                value={line.itemId}
                onValueChange={(v) =>
                  setLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, itemId: v } : l)))
                }
              >
                <SelectTrigger><SelectValue placeholder="Select catalog item" /></SelectTrigger>
                <SelectContent>
                  {activeCatalog.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {formatCurrency(c.unitCost)}/{c.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.key === line.key ? { ...l, qty: e.target.value } : l))
                  )
                }
                placeholder="Qty"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
              >
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          ))}
          {errors.lines && <p className="text-xs text-danger">{errors.lines}</p>}
        </div>

        <div className="rounded-xl bg-bg px-3 py-2 text-sm">
          <span className="text-muted">Estimated total: </span>
          <span className="font-bold text-heading">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          <ClipboardPlus className="h-4 w-4" />
          Submit requisition
        </Button>
      </div>
    </ModalPortal>
  );
}
