"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, LogIn, LogOut, X } from "lucide-react";
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
import { classes } from "@/data/students";
import {
  rejoinStudent,
  transferStudentBranch,
  withdrawStudent,
} from "@/lib/mock-service";
import { isBillableStudent } from "@/lib/eligibility";
import type { Student } from "@/types";
import { toast } from "sonner";

type Mode = "transfer" | "withdraw" | "rejoin" | null;

type Props = {
  student: Student;
  onUpdated: (student: Student) => void;
};

export function StudentLifecycleActions({ student, onUpdated }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const billable = isBillableStudent(student);
  const canRejoin = student.status === "inactive" || student.status === "alumni";

  return (
    <>
      <div className="mt-4 grid w-full gap-2">
        {billable && (
          <>
            <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setMode("transfer")}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Change branch
            </Button>
            <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setMode("withdraw")}>
              <LogOut className="h-3.5 w-3.5" />
              Withdraw student
            </Button>
          </>
        )}
        {canRejoin && (
          <Button type="button" size="sm" className="w-full" onClick={() => setMode("rejoin")}>
            <LogIn className="h-3.5 w-3.5" />
            Rejoin campus
          </Button>
        )}
      </div>

      <TransferStudentModal
        open={mode === "transfer"}
        student={student}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
      <WithdrawStudentModal
        open={mode === "withdraw"}
        student={student}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
      <RejoinStudentModal
        open={mode === "rejoin"}
        student={student}
        onClose={() => setMode(null)}
        onUpdated={onUpdated}
      />
    </>
  );
}

function TransferStudentModal({
  open,
  student,
  onClose,
  onUpdated,
}: {
  open: boolean;
  student: Student;
  onClose: () => void;
  onUpdated: (s: Student) => void;
}) {
  const [branchId, setBranchId] = useState(student.branchId);
  const [classId, setClassId] = useState(student.classId);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setBranchId(student.branchId);
    setClassId(student.classId);
    setNotes("");
  }, [open, student]);

  const branchClasses = useMemo(
    () => classes.filter((c) => c.branchId === branchId),
    [branchId]
  );

  useEffect(() => {
    if (!branchClasses.some((c) => c.id === classId)) {
      setClassId(branchClasses[0]?.id ?? "");
    }
  }, [branchClasses, classId]);

  const submit = async () => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) {
      toast.error("Select a class at the destination branch");
      return;
    }
    if (cls.branchId === student.branchId && cls.id === student.classId) {
      toast.error("Choose a different branch or class");
      return;
    }
    const updated = await transferStudentBranch(student.id, {
      branchId: cls.branchId,
      classId: cls.id,
      className: cls.name,
      notes: notes.trim() || undefined,
    });
    if (!updated) return;
    onUpdated(updated);
    toast.success(
      `Transferred to ${branches.find((b) => b.id === cls.branchId)?.name ?? "new branch"} · ${cls.name}`
    );
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <ModalHeader title="Change branch" subtitle={`${student.firstName} ${student.lastName}`} onClose={onClose} icon={<ArrowLeftRight className="h-5 w-5 text-brand-500" />} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <p className="text-xs text-muted">
          Current: {branches.find((b) => b.id === student.branchId)?.name} · {student.className}
        </p>
        <div>
          <Label>Destination branch</Label>
          <Select
            value={branchId}
            onValueChange={(v) => {
              setBranchId(v);
              const first = classes.find((c) => c.branchId === v);
              setClassId(first?.id ?? "");
            }}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Class at destination</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {branchClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="xferNotes">Notes (optional)</Label>
          <Textarea id="xferNotes" className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onConfirm={submit} confirmLabel="Transfer" />
    </ModalPortal>
  );
}

function WithdrawStudentModal({
  open,
  student,
  onClose,
  onUpdated,
}: {
  open: boolean;
  student: Student;
  onClose: () => void;
  onUpdated: (s: Student) => void;
}) {
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setLeaveDate(new Date().toISOString().slice(0, 10));
    setReason("");
  }, [open]);

  const submit = async () => {
    if (!leaveDate) {
      toast.error("Leave date required");
      return;
    }
    const updated = await withdrawStudent(student.id, {
      leaveDate,
      reason: reason.trim() || undefined,
    });
    if (!updated) return;
    onUpdated(updated);
    toast.success("Student withdrawn — billing and new fee entries blocked");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <ModalHeader title="Withdraw student" subtitle={`${student.firstName} ${student.lastName}`} onClose={onClose} icon={<LogOut className="h-5 w-5 text-danger" />} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <p className="rounded-lg bg-soft-red/50 px-3 py-2 text-xs text-danger">
          Sets status to inactive. No new invoices until the student rejoins.
        </p>
        <div>
          <Label htmlFor="leaveDate">Last day / leave date</Label>
          <Input id="leaveDate" type="date" className="mt-1" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea id="reason" className="mt-1" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Relocation, parent request…" />
        </div>
      </div>
      <ModalFooter onClose={onClose} onConfirm={submit} confirmLabel="Confirm withdraw" />
    </ModalPortal>
  );
}

function RejoinStudentModal({
  open,
  student,
  onClose,
  onUpdated,
}: {
  open: boolean;
  student: Student;
  onClose: () => void;
  onUpdated: (s: Student) => void;
}) {
  const [branchId, setBranchId] = useState(student.branchId);
  const [classId, setClassId] = useState(student.classId);
  const [rejoinDate, setRejoinDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setBranchId(student.branchId);
    setClassId(student.classId);
    setRejoinDate(new Date().toISOString().slice(0, 10));
  }, [open, student]);

  const branchClasses = useMemo(
    () => classes.filter((c) => c.branchId === branchId),
    [branchId]
  );

  useEffect(() => {
    if (!branchClasses.some((c) => c.id === classId)) {
      setClassId(branchClasses[0]?.id ?? "");
    }
  }, [branchClasses, classId]);

  const submit = async () => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) {
      toast.error("Select a class");
      return;
    }
    const updated = await rejoinStudent(student.id, {
      branchId: cls.branchId,
      classId: cls.id,
      className: cls.name,
      rejoinDate,
    });
    if (!updated) return;
    onUpdated(updated);
    toast.success("Student rejoined — active and billable again");
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-md">
      <ModalHeader title="Rejoin campus" subtitle={`${student.firstName} ${student.lastName}`} onClose={onClose} icon={<LogIn className="h-5 w-5 text-brand-500" />} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <p className="text-xs text-muted">
          Reactivates as active. Pick the campus and class for return.
        </p>
        <div>
          <Label htmlFor="rejoinDate">Rejoin date</Label>
          <Input id="rejoinDate" type="date" className="mt-1" value={rejoinDate} onChange={(e) => setRejoinDate(e.target.value)} />
        </div>
        <div>
          <Label>Branch</Label>
          <Select
            value={branchId}
            onValueChange={(v) => {
              setBranchId(v);
              setClassId(classes.find((c) => c.branchId === v)?.id ?? "");
            }}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branchClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ModalFooter onClose={onClose} onConfirm={submit} confirmLabel="Confirm rejoin" />
    </ModalPortal>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
  icon,
}: {
  title: string;
  subtitle: string;
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
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ModalFooter({
  onClose,
  onConfirm,
  confirmLabel,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
      <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  );
}
