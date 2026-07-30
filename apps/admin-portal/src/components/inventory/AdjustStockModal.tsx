"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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
import { adjustStock } from "@/lib/mock-service";
import type { InventoryItem, StockLevel } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  items: InventoryItem[];
  initial?: { itemId?: string; branchId?: string };
  onClose: () => void;
  onAdjusted: (level: StockLevel) => void;
};

export function AdjustStockModal({ open, items, initial, onClose, onAdjusted }: Props) {
  const [itemId, setItemId] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [delta, setDelta] = useState("10");
  const [reason, setReason] = useState("receive");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setItemId(initial?.itemId ?? items[0]?.id ?? "");
    setBranchId(initial?.branchId ?? branches[0]?.id ?? "");
    setDelta("10");
    setReason("receive");
    setErrors({});
  }, [open, initial, items]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!itemId) next.itemId = "Select an item";
    if (!branchId) next.branchId = "Select a branch";
    const d = Number(delta);
    if (Number.isNaN(d) || d === 0) next.delta = "Enter a non-zero quantity";
    setErrors(next);
    if (Object.keys(next).length) return;

    const signed = reason === "issue" || reason === "damage" ? -Math.abs(d) : Math.abs(d);
    const level = await adjustStock({ itemId, branchId, delta: signed });
    onAdjusted(level);
    toast.success(
      signed > 0
        ? `Stock increased by ${signed}`
        : `Stock decreased by ${Math.abs(signed)}`
    );
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <SlidersHorizontal className="h-5 w-5 text-brand-500" />
            Adjust stock
          </h2>
          <p className="mt-1 text-sm text-muted">Receive, issue, or correct on-hand quantity.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div>
          <Label>Item</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select item" /></SelectTrigger>
            <SelectContent>
              {items.filter((i) => i.active).map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.itemId && <p className="mt-1 text-xs text-danger">{errors.itemId}</p>}
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Movement</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receive">Receive (+)</SelectItem>
                <SelectItem value="issue">Issue / use (−)</SelectItem>
                <SelectItem value="damage">Damage / write-off (−)</SelectItem>
                <SelectItem value="correction">Correction (+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" min={1} className="mt-1" value={delta} onChange={(e) => setDelta(e.target.value)} />
            {errors.delta && <p className="mt-1 text-xs text-danger">{errors.delta}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-[#F1F3F5] px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>Save adjustment</Button>
      </div>
    </ModalPortal>
  );
}
