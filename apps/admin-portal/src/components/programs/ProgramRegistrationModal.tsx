"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import { registerForProgram } from "@/lib/mock-service";
import { todayIso } from "@/lib/fee-challan";
import { calculateAge, cn, formatCurrency } from "@/lib/utils";
import type { Parent, ProgramParticipantType, ProgramRegistration, SpecialProgram, Student } from "@/types";

const selectClass = "mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-heading";

type Props = {
  open: boolean;
  program: SpecialProgram;
  students: Student[];
  parents: Parent[];
  onClose: () => void;
  onRegistered: (r: ProgramRegistration) => void;
};

export function ProgramRegistrationModal({ open, program, students, parents, onClose, onRegistered }: Props) {
  const [type, setType] = useState<ProgramParticipantType>("enrolled");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentName, setParentName] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [externalSchool, setExternalSchool] = useState("");
  const [registrationDate, setRegistrationDate] = useState(todayIso());
  const [amount, setAmount] = useState(String(program.fee));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligible = useMemo(
    () =>
      students
        .filter((s) => s.status === "active" || s.status === "pending_first_payment")
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [students]
  );

  useEffect(() => {
    if (!open) return;
    setType("enrolled");
    setStudentId("");
    setStudentName("");
    setDob("");
    setGender("male");
    setParentName("");
    setParentContact("");
    setExternalSchool("");
    setRegistrationDate(todayIso());
    setAmount(String(program.fee));
    setNotes("");
    setErrors({});
  }, [open, program.fee]);

  // Auto-fill from the student record
  const pickStudent = (id: string) => {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (!s) return;
    const ps = s.parentIds.map((pid) => parents.find((p) => p.id === pid)).filter((p): p is Parent => !!p);
    const primary = ps.find((p) => p.relation === "father") ?? ps[0];
    setStudentName(`${s.firstName} ${s.lastName}`);
    setDob(s.dob);
    setGender(s.gender);
    setParentName(primary?.name ?? "");
    setParentContact(primary?.phone ?? "");
  };

  const selected = students.find((s) => s.id === studentId);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (type === "enrolled" && !studentId) next.studentId = "Select a student";
    if (studentName.trim().length < 2) next.studentName = "Child's name required";
    if (!dob) next.dob = "Date of birth required";
    if (parentName.trim().length < 2) next.parentName = "Parent name required";
    if (parentContact.replace(/\D/g, "").length < 10) next.parentContact = "Valid contact number required";
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) next.amount = "Enter a valid amount";
    setErrors(next);
    if (Object.keys(next).length) return;

    const result = await registerForProgram({
      programId: program.id,
      participantType: type,
      studentId: type === "enrolled" ? studentId : undefined,
      studentName: studentName.trim(),
      grNumber: type === "enrolled" ? selected?.grNumber : undefined,
      parentName: parentName.trim(),
      parentContact: parentContact.trim(),
      dob,
      gender,
      externalSchool: type === "external" ? externalSchool.trim() || undefined : undefined,
      registrationDate,
      amount: amt,
      notes: notes.trim() || undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onRegistered({ ...result.registration });
    toast.success(
      result.registration.voucherNumber
        ? `Registered · voucher ${result.registration.voucherNumber} generated`
        : `Registered · ${result.registration.registrationNo}`
    );
    onClose();
  };

  return (
    <ModalPortal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <UserPlus className="h-5 w-5 text-brand-500" />
            Register child
          </h2>
          <p className="mt-1 text-sm text-muted">
            {program.name} · {program.fee > 0 ? formatCurrency(program.fee) : "Free"}
            {program.fee > 0 && (program.voucherRequired ? " · voucher will be generated" : " · payment recorded without voucher")}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="inline-flex rounded-xl bg-bg p-1">
          {(
            [
              ["enrolled", "Existing SDLC student"],
              ["external", "Outside / non-enrolled child"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              disabled={v === "external" && !program.openToExternal}
              onClick={() => {
                setType(v);
                setStudentId("");
                setStudentName("");
                setDob("");
                setParentName("");
                setParentContact("");
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                type === v ? "bg-surface text-heading shadow-sm" : "text-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {!program.openToExternal && (
          <p className="-mt-2 text-[11px] text-muted">This program is for enrolled students only.</p>
        )}

        {type === "enrolled" && (
          <div>
            <Label>Student</Label>
            <select className={selectClass} value={studentId} onChange={(e) => pickStudent(e.target.value)}>
              <option value="">Select student…</option>
              {eligible.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.grNumber ?? "no GR"} · {s.className}
                </option>
              ))}
            </select>
            {errors.studentId && <p className="mt-1 text-xs text-danger">{errors.studentId}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rname">Student name</Label>
            <Input id="rname" className="mt-1" value={studentName} readOnly={type === "enrolled"} onChange={(e) => setStudentName(e.target.value)} />
            {errors.studentName && <p className="mt-1 text-xs text-danger">{errors.studentName}</p>}
          </div>
          <div>
            <Label>G.R. No.</Label>
            <Input
              className="mt-1"
              readOnly
              value={type === "enrolled" ? selected?.grNumber ?? "" : "Outside child — registration no. assigned"}
            />
          </div>
          <div>
            <Label htmlFor="rdob">Date of birth</Label>
            <Input id="rdob" type="date" className="mt-1" value={dob} readOnly={type === "enrolled"} onChange={(e) => setDob(e.target.value)} />
            {dob && <p className="mt-1 text-[11px] text-muted">Age {calculateAge(dob)} years</p>}
            {errors.dob && <p className="mt-1 text-xs text-danger">{errors.dob}</p>}
          </div>
          <div>
            <Label>Gender</Label>
            <select className={selectClass} value={gender} disabled={type === "enrolled"} onChange={(e) => setGender(e.target.value as "male" | "female")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <Label htmlFor="rparent">Parent name</Label>
            <Input id="rparent" className="mt-1" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            {errors.parentName && <p className="mt-1 text-xs text-danger">{errors.parentName}</p>}
          </div>
          <div>
            <Label htmlFor="rcontact">Parent contact</Label>
            <Input id="rcontact" className="mt-1" value={parentContact} onChange={(e) => setParentContact(e.target.value)} placeholder="+92 3xx xxxxxxx" />
            {errors.parentContact && <p className="mt-1 text-xs text-danger">{errors.parentContact}</p>}
          </div>
          {type === "external" && (
            <div className="sm:col-span-2">
              <Label htmlFor="rschool">Current school (optional)</Label>
              <Input id="rschool" className="mt-1" value={externalSchool} onChange={(e) => setExternalSchool(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="rdate">Registration date</Label>
            <Input id="rdate" type="date" className="mt-1" value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ramount">Amount (PKR)</Label>
            <Input id="ramount" type="number" min={0} className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted">Program fee {formatCurrency(program.fee)} · adjust for discounts / siblings</p>
            {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="rnotes">Notes</Label>
            <Textarea id="rnotes" rows={2} className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit}>Register</Button>
      </div>
    </ModalPortal>
  );
}
