"use client";

import { useState } from "react";
import { PackagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInventoryItem } from "@/lib/mock-service";
import type { InventoryCategory, InventoryItem } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (item: InventoryItem) => void;
};

export function AddInventoryItemModal({ open, onClose, onCreated }: Props) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("supplies");
  const [unit, setUnit] = useState("piece");
  const [reorderLevel, setReorderLevel] = useState("5");
  const [unitCost, setUnitCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setSku("");
    setName("");
    setCategory("supplies");
    setUnit("piece");
    setReorderLevel("5");
    setUnitCost("0");
    setNotes("");
    setErrors({});
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (sku.trim().length < 2) next.sku = "SKU required";
    if (name.trim().length < 2) next.name = "Name required";
    if (!unit.trim()) next.unit = "Unit required";
    const reorder = Number(reorderLevel);
    const cost = Number(unitCost);
    if (Number.isNaN(reorder) || reorder < 0) next.reorderLevel = "Valid reorder level required";
    if (Number.isNaN(cost) || cost < 0) next.unitCost = "Valid unit cost required";
    setErrors(next);
    if (Object.keys(next).length) return;

    const item = await createInventoryItem({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      unit: unit.trim(),
      reorderLevel: reorder,
      unitCost: cost,
      active: true,
      notes: notes.trim() || undefined,
    });
    onCreated(item);
    toast.success(`${item.name} added to catalog`);
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
      maxWidth="max-w-lg"
    >
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <PackagePlus className="h-5 w-5 text-brand-500" />
            Add inventory item
          </h2>
          <p className="mt-1 text-sm text-muted">Catalog item for stock tracking and purchase requests.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" className="mt-1" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SUP-001" />
            {errors.sku && <p className="mt-1 text-xs text-danger">{errors.sku}</p>}
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as InventoryCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="therapy">Therapy</SelectItem>
                <SelectItem value="playground">Playground</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="itemName">Item name</Label>
          <Input id="itemName" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" className="mt-1" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="piece / pack / liter" />
            {errors.unit && <p className="mt-1 text-xs text-danger">{errors.unit}</p>}
          </div>
          <div>
            <Label htmlFor="reorder">Reorder level</Label>
            <Input id="reorder" type="number" min={0} className="mt-1" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
            {errors.reorderLevel && <p className="mt-1 text-xs text-danger">{errors.reorderLevel}</p>}
          </div>
          <div>
            <Label htmlFor="cost">Unit cost (PKR)</Label>
            <Input id="cost" type="number" min={0} className="mt-1" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            {errors.unitCost && <p className="mt-1 text-xs text-danger">{errors.unitCost}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          <PackagePlus className="h-4 w-4" />
          Save item
        </Button>
      </div>
    </ModalPortal>
  );
}
