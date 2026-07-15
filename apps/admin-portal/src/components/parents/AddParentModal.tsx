"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branches } from "@/data/branches";
import type { ParentAccount, ParentAccountStatus } from "@/data/parents";
import { toast } from "sonner";

export type AddParentValues = {
  name: string;
  email: string;
  phone: string;
  branchId: string;
  relation: string;
  childrenNames: string[];
  portalAccess: boolean;
  status: ParentAccountStatus;
  emergencyNotify: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (parent: ParentAccount) => void;
  defaultBranchId?: string;
};

export function AddParentModal({ open, onClose, onSave, defaultBranchId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId ?? branches[0]?.id ?? "");
  const [relation, setRelation] = useState("mother");
  const [childrenInput, setChildrenInput] = useState("");
  const [portalAccess, setPortalAccess] = useState(true);
  const [emergencyNotify, setEmergencyNotify] = useState(true);
  const [status, setStatus] = useState<ParentAccountStatus>("pending");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBranchId(defaultBranchId ?? branches[0]?.id ?? "");
    setRelation("mother");
    setChildrenInput("");
    setPortalAccess(true);
    setEmergencyNotify(true);
    setStatus("pending");
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Valid email required";
    if (phone.trim().length < 10) next.phone = "Valid phone required";
    if (!branchId) next.branchId = "Branch required";
    setErrors(next);
    if (Object.keys(next).length) return;

    const childrenNames = childrenInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const parent: ParentAccount = {
      id: `par-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      status,
      branchId,
      childrenNames,
      portalAccess,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onSave(parent);
    toast.success(
      portalAccess
        ? `Parent added — portal invite will be sent to ${parent.email}`
        : "Parent added successfully"
    );
    reset();
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={handleClose} maxWidth="max-w-lg">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <UserPlus className="h-5 w-5 text-brand-500" />
            Add Parent
          </h2>
          <p className="mt-1 text-sm text-muted">Create a parent account for the family portal.</p>
        </div>
        <button type="button" onClick={handleClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label htmlFor="parentName">Full name</Label>
          <Input id="parentName" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fatima Khan" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="parentEmail">Email</Label>
            <Input id="parentEmail" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="parentPhone">Phone</Label>
            <Input id="parentPhone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
            {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Relation</Label>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branchId && <p className="mt-1 text-xs text-danger">{errors.branchId}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="childrenNames">Linked children (comma-separated)</Label>
          <Input
            id="childrenNames"
            className="mt-1"
            value={childrenInput}
            onChange={(e) => setChildrenInput(e.target.value)}
            placeholder="e.g. Hamdan Khan, Omar Ahmed"
          />
        </div>
        <div>
          <Label>Account status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ParentAccountStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2.5 rounded-2xl border border-[#F1F3F5] p-4">
          <div className="flex items-center gap-2.5">
            <Checkbox id="portalAccess" checked={portalAccess} onCheckedChange={(c) => setPortalAccess(c === true)} />
            <Label htmlFor="portalAccess" className="cursor-pointer font-normal">Grant parent portal access</Label>
          </div>
          <div className="flex items-center gap-2.5">
            <Checkbox id="emergencyNotify" checked={emergencyNotify} onCheckedChange={(c) => setEmergencyNotify(c === true)} />
            <Label htmlFor="emergencyNotify" className="cursor-pointer font-normal">Enable emergency notifications</Label>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          <UserPlus className="h-4 w-4" />
          Add Parent
        </Button>
      </div>
    </ModalPortal>
  );
}
