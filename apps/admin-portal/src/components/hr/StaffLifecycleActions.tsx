"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeftRight, LogIn, LogOut, X } from "lucide-react";
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
import { rejoinStaff, transferStaffBranch, withdrawStaff } from "@/lib/mock-service";
import { isPayableStaff } from "@/lib/eligibility";
import type { Staff, StaffStatus } from "@/types";
import { toast } from "sonner";

type Mode = "transfer" | "withdraw" | "rejoin" | null;

type Props = {
  member: Staff;
  onUpdated: (member: Staff) => void;
};

export function StaffLifecycleActions({ member, onUpdated }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const payable = isPayableStaff(member);

  return (
    <>
      <div className="mt-4 grid w-full max-w-xs gap-2">
        {payable && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode("transfer")}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Change branch
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setMode("withdraw")}>
              <LogOut className="h-3.5 w-3.5" />
              Withdraw / resign
            </Button>
          </>
        )}
        {!payable && (
          <Button type="button" size="sm" onClick={() => setMode("rejoin")}>
            <LogIn className="h-3.5 w-3.5" />
            Rejoin / reactivate
          </Button>
        )}
      </div>

      <TransferStaffModal
        open={mode === "transfer"}
        member={member}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
      <WithdrawStaffModal
        open={mode === "withdraw"}
        member={member}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
      <RejoinStaffModal
        open={mode === "rejoin"}
        member={member}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
    </>
  );
}

function TransferStaffModal({
  open,
  member,
  onClose,
  onUpdated,
}: {
  open: boolean;
  member: Staff;
  onClose: () => void;
  onUpdated: (m: Staff) => void;
}) {
  const [branchId, setBranchId] = useState(member.branchId);

  useEffect(() => {
    if (open) setBranchId(member.branchId);
  }, [open, member.branchId]);

  const submit = async () => {
    if (branchId === member.branchId) {
      toast.error("Select a different branch");
      return;
    }
    const updated = await transferStaffBranch(member.id, { branchId });
    if (!updated) return;
    onUpdated(updated);
    toast.success(`Transferred to ${branches.find((b) => b.id === branchId)?.name ?? "new branch"}`);
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <Header title="Change branch" name={member.name} onClose={onClose} icon={<ArrowLeftRight className="h-5 w-5 text-brand-500" />} />
      <div className="space-y-4 px-6 py-5">
        <p className="text-xs text-muted">
          Current: {branches.find((b) => b.id === member.branchId)?.name}
        </p>
        <div>
          <Label>Destination branch</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Footer onClose={onClose} onConfirm={submit} label="Transfer" />
    </ModalPortal>
  );
}

function WithdrawStaffModal({
  open,
  member,
  onClose,
  onUpdated,
}: {
  open: boolean;
  member: Staff;
  onClose: () => void;
  onUpdated: (m: Staff) => void;
}) {
  const [status, setStatus] = useState<Exclude<StaffStatus, "active">>("resigned");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setStatus("resigned");
    setEndDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const submit = async () => {
    if (!endDate) {
      toast.error("Last working day required");
      return;
    }
    const updated = await withdrawStaff(member.id, { status, endDate });
    if (!updated) return;
    onUpdated(updated);
    toast.success("Staff withdrawn — removed from payroll");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <Header title="Withdraw / resign" name={member.name} onClose={onClose} icon={<LogOut className="h-5 w-5 text-danger" />} />
      <div className="space-y-4 px-6 py-5">
        <p className="rounded-lg bg-soft-red/50 px-3 py-2 text-xs text-danger">
          Employee will be excluded from payroll and new HR financial entries.
        </p>
        <div>
          <Label>Exit type</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Exclude<StaffStatus, "active">)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="inactive">Inactive / leave</SelectItem>
              <SelectItem value="fired">Fired / terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="endDate">Last working day</Label>
          <Input id="endDate" type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <Footer onClose={onClose} onConfirm={submit} label="Confirm withdraw" />
    </ModalPortal>
  );
}

function RejoinStaffModal({
  open,
  member,
  onClose,
  onUpdated,
}: {
  open: boolean;
  member: Staff;
  onClose: () => void;
  onUpdated: (m: Staff) => void;
}) {
  const [branchId, setBranchId] = useState(member.branchId);
  const [rejoinDate, setRejoinDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setBranchId(member.branchId);
    setRejoinDate(new Date().toISOString().slice(0, 10));
  }, [open, member.branchId]);

  const submit = async () => {
    const updated = await rejoinStaff(member.id, { branchId, rejoinDate });
    if (!updated) return;
    onUpdated(updated);
    toast.success("Staff rejoined — active on payroll again");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <Header title="Rejoin / reactivate" name={member.name} onClose={onClose} icon={<LogIn className="h-5 w-5 text-brand-500" />} />
      <div className="space-y-4 px-6 py-5">
        <div>
          <Label htmlFor="rejoinDate">Rejoin date</Label>
          <Input id="rejoinDate" type="date" className="mt-1" value={rejoinDate} onChange={(e) => setRejoinDate(e.target.value)} />
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
      </div>
      <Footer onClose={onClose} onConfirm={submit} label="Confirm rejoin" />
    </ModalPortal>
  );
}

/** Also used from directory Employment status — persist via mock-service */
export async function persistStaffStatus(
  id: string,
  status: StaffStatus,
  endDate?: string
): Promise<Staff | undefined> {
  if (status === "active") {
    return rejoinStaff(id, {});
  }
  return withdrawStaff(id, {
    status,
    endDate: endDate ?? new Date().toISOString().slice(0, 10),
  });
}

function Header({
  title,
  name,
  onClose,
  icon,
}: {
  title: string;
  name: string;
  onClose: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{name}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function Footer({
  onClose,
  onConfirm,
  label,
}: {
  onClose: () => void;
  onConfirm: () => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
      <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      <Button type="button" onClick={onConfirm}>{label}</Button>
    </div>
  );
}
