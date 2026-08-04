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
import {
  REQUISITION_KINDS,
  REQUISITION_MONTHS,
  defaultForMonth,
  lineAmount,
  requisitionTotal,
} from "@/lib/procurement";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem, PRLineItem, PurchaseRequisition, RequisitionKind } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  catalog: InventoryItem[];
  onClose: () => void;
  onCreated: (pr: PurchaseRequisition) => void;
};

type DraftLine = {
  key: string;
  mode: "catalog" | "custom";
  itemId: string;
  customName: string;
  brand: string;
  qty: string;
  unitPrice: string;
  remarks: string;
};

function emptyLine(): DraftLine {
  return {
    key: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mode: "catalog",
    itemId: "",
    customName: "",
    brand: "",
    qty: "1",
    unitPrice: "0",
    remarks: "",
  };
}

export function AddRequisitionModal({ open, catalog, onClose, onCreated }: Props) {
  const activeCatalog = useMemo(() => catalog.filter((c) => c.active), [catalog]);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [requestedBy, setRequestedBy] = useState("");
  const [kind, setKind] = useState<RequisitionKind>("stationery");
  const [forMonth, setForMonth] = useState(defaultForMonth());
  const [summary, setSummary] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setBranchId(branches[0]?.id ?? "");
    setRequestedBy("");
    setKind("stationery");
    setForMonth(defaultForMonth());
    setSummary("");
    setLines([emptyLine()]);
    setErrors({});
  };

  const builtLines: PRLineItem[] = lines
    .map((l, idx) => {
      const qty = Number(l.qty);
      const unitPrice = Number(l.unitPrice);
      if (!qty || qty <= 0 || Number.isNaN(unitPrice) || unitPrice < 0) return null;

      if (l.mode === "catalog") {
        const item = activeCatalog.find((c) => c.id === l.itemId);
        if (!item) return null;
        return {
          id: `pri-new-${idx}-${Date.now()}`,
          itemId: item.id,
          item: item.name,
          qty,
          unitPrice,
          brand: l.brand.trim() || undefined,
          remarks: l.remarks.trim() || undefined,
        };
      }

      if (l.customName.trim().length < 2) return null;
      return {
        id: `pri-new-${idx}-${Date.now()}`,
        item: l.customName.trim(),
        qty,
        unitPrice,
        brand: l.brand.trim() || undefined,
        remarks: l.remarks.trim() || undefined,
      };
    })
    .filter(Boolean) as PRLineItem[];

  const total = requisitionTotal(builtLines);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (requestedBy.trim().length < 2) next.requestedBy = "Requester name required";
    if (summary.trim().length < 3) next.summary = "Summary required";
    if (!branchId) next.branchId = "Branch required";
    if (builtLines.length === 0) {
      next.lines = "Add catalog or custom items with quantity (amount may be 0 for HO to fill)";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const pr = await createPurchaseRequisition({
      branchId,
      requestedBy: requestedBy.trim(),
      summary: summary.trim(),
      kind,
      forMonth,
      items: builtLines,
    });
    onCreated(pr);
    toast.success("Requisition submitted to Head Office");
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
      maxWidth="max-w-2xl"
    >
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <ClipboardPlus className="h-5 w-5 text-brand-500" />
            New purchase requisition
          </h2>
          <p className="mt-1 text-sm text-muted">
            SDLC catalogue — stationery, groceries, books, courses, or any inventory. HO will price &amp; bill.
          </p>
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
          <div>
            <Label>Requisition type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as RequisitionKind)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUISITION_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>For month</Label>
            <Select value={forMonth.split(" ")[0]} onValueChange={(m) => setForMonth(`${m} (${new Date().getFullYear()})`)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUISITION_MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Input
            id="summary"
            className="mt-1"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. August stationery + library books"
          />
          {errors.summary && <p className="mt-1 text-xs text-danger">{errors.summary}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Line items (qty + amount per item)</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
              <Plus className="h-3.5 w-3.5" />
              Add line
            </Button>
          </div>
          {lines.map((line) => {
            const cat = activeCatalog.find((c) => c.id === line.itemId);
            const qty = Number(line.qty) || 0;
            const price = Number(line.unitPrice) || 0;
            return (
              <div key={line.key} className="space-y-2 rounded-xl border border-[#F1F3F5] p-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={line.mode === "catalog" ? "default" : "outline"}
                    onClick={() =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, mode: "catalog" } : l))
                      )
                    }
                  >
                    Catalog
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={line.mode === "custom" ? "default" : "outline"}
                    onClick={() =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, mode: "custom", itemId: "" } : l))
                      )
                    }
                  >
                    Custom (book / course / other)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
                {line.mode === "catalog" ? (
                  <Select
                    value={line.itemId}
                    onValueChange={(v) => {
                      const item = activeCatalog.find((c) => c.id === v);
                      setLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? {
                                ...l,
                                itemId: v,
                                unitPrice: item ? String(item.unitCost) : l.unitPrice,
                              }
                            : l
                        )
                      );
                    }}
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
                ) : (
                  <Input
                    placeholder="Item description (e.g. Phonics course seat, Urdu reader)"
                    value={line.customName}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, customName: e.target.value } : l))
                      )
                    }
                  />
                )}
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input
                    placeholder="Brand"
                    value={line.brand}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, brand: e.target.value } : l))
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={line.qty}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, qty: e.target.value } : l))
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Amount / unit"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) => (l.key === line.key ? { ...l, unitPrice: e.target.value } : l))
                      )
                    }
                  />
                  <div className="flex items-center text-sm font-medium text-heading">
                    = {formatCurrency(lineAmount(qty, price))}
                    {cat ? <span className="ml-1 text-xs text-muted">/{cat.unit}</span> : null}
                  </div>
                </div>
                <Input
                  placeholder="Remarks / amount note"
                  value={line.remarks}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l) => (l.key === line.key ? { ...l, remarks: e.target.value } : l))
                    )
                  }
                />
              </div>
            );
          })}
          {errors.lines && <p className="text-xs text-danger">{errors.lines}</p>}
        </div>

        <div className="rounded-xl bg-bg px-3 py-2 text-sm">
          <span className="text-muted">Estimated total: </span>
          <span className="font-bold text-heading">{formatCurrency(total)}</span>
          <span className="ml-2 text-xs text-muted">(HO confirms amounts when generating bill)</span>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          <ClipboardPlus className="h-4 w-4" />
          Submit to Head Office
        </Button>
      </div>
    </ModalPortal>
  );
}
