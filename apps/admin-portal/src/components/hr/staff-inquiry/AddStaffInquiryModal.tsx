"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
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
import { branches } from "@/data/branches";
import type { StaffInquiryCard, StaffInquiryTag, StaffRole } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (card: StaffInquiryCard) => void;
};

export function AddStaffInquiryModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [experienceYears, setExperienceYears] = useState("0");
  const [tag, setTag] = useState<StaffInquiryTag>("online");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("teacher");
    setBranchId(branches[0]?.id ?? "");
    setExperienceYears("0");
    setTag("online");
    setDescription("");
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
    setErrors(next);
    if (Object.keys(next).length) return;

    const now = new Date();
    const card: StaffInquiryCard = {
      id: `si-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      branchId,
      stage: "new_inquiry",
      daysInStage: 0,
      tag,
      description: description.trim() || `New staff inquiry for ${role} role.`,
      experienceYears: Number(experienceYears) || 0,
      inquiryTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      createdAt: now.toISOString().slice(0, 10),
    };
    onSave(card);
    toast.success("Staff inquiry added to pipeline");
    reset();
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={handleClose} maxWidth="max-w-lg">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <UserPlus className="h-5 w-5 text-brand-500" />
            Add Staff Inquiry
          </h2>
          <p className="mt-1 text-sm text-muted">Manually log a candidate into the hiring pipeline.</p>
        </div>
        <button type="button" onClick={handleClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label htmlFor="staffName">Full name</Label>
          <Input id="staffName" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="staffEmail">Email</Label>
            <Input id="staffEmail" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="staffPhone">Phone</Label>
            <Input id="staffPhone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="therapist">Therapist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="exp">Years of experience</Label>
            <Input id="exp" type="number" min={0} className="mt-1" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
          </div>
        </div>
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
            <Label>Source tag</Label>
            <Select value={tag} onValueChange={(v) => setTag(v as StaffInquiryTag)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="campus_posting">Campus posting</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="hot_lead">Hot lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="staffDesc">Description / notes</Label>
          <Textarea id="staffDesc" className="mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
        <Button type="button" onClick={submit}>
          <UserPlus className="h-4 w-4" />
          Add to pipeline
        </Button>
      </div>
    </ModalPortal>
  );
}
