"use client";

import { useEffect, useState } from "react";
import { UserCog, X } from "lucide-react";
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
import { inactiveStaffMessage } from "@/lib/eligibility";
import type { Staff, StaffStatus } from "@/types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSave: (id: string, status: StaffStatus, endDate?: string) => void;
};

export function EditStaffStatusModal({ open, staff, onClose, onSave }: Props) {
  const [status, setStatus] = useState<StaffStatus>("active");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!staff) return;
    setStatus(staff.status);
    setEndDate(staff.endDate ?? new Date().toISOString().slice(0, 10));
  }, [staff]);

  const handleSave = () => {
    if (!staff) return;
    if (status !== "active" && !endDate) {
      toast.error("End date required when marking resigned / fired / inactive");
      return;
    }
    onSave(staff.id, status, status === "active" ? undefined : endDate);
    toast.success(
      status === "active"
        ? "Staff marked active — included in payroll again"
        : inactiveStaffMessage(status)
    );
    onClose();
  };

  return (
    <ModalPortal open={open && !!staff} onClose={onClose} maxWidth="max-w-md">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <UserCog className="h-5 w-5 text-brand-500" />
            Employment status
          </h2>
          {staff && <p className="mt-1 text-sm text-muted">{staff.name}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StaffStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="fired">Fired / terminated</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {status !== "active" && (
            <p className="mt-1 text-xs text-muted">
              Will be excluded from payroll and any new HR financial entries.
            </p>
          )}
        </div>
        {status !== "active" && (
          <div>
            <Label htmlFor="endDate">Last working day</Label>
            <Input
              id="endDate"
              type="date"
              className="mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={handleSave}>Save</Button>
      </div>
    </ModalPortal>
  );
}
