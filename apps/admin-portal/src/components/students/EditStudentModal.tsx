"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
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
import { classes } from "@/data/students";
import { branches } from "@/data/branches";
import type { Student, StudentStatus } from "@/types";
import { toast } from "sonner";

export type EditStudentValues = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female";
  bloodGroup: string;
  classId: string;
  className: string;
  branchId: string;
  status: StudentStatus;
  feePlan: string;
  allergies: string;
};

type Props = {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (id: string, values: EditStudentValues) => void;
};

export function EditStudentModal({ open, student, onClose, onSave }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [classId, setClassId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");
  const [feePlan, setFeePlan] = useState("");
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    if (!student) return;
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setDob(student.dob);
    setGender(student.gender);
    setBloodGroup(student.bloodGroup);
    setClassId(student.classId);
    setBranchId(student.branchId);
    setStatus(student.status === "waitlist" ? "active" : student.status);
    setFeePlan(student.feePlan ?? "");
    setAllergies(student.allergies.join(", "));
  }, [student]);

  const handleSave = () => {
    if (!student) return;
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      toast.error("First and last name are required");
      return;
    }
    const cls = classes.find((c) => c.id === classId);
    onSave(student.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      gender,
      bloodGroup: bloodGroup.trim() || student.bloodGroup,
      classId,
      className: cls?.name ?? student.className,
      branchId: cls?.branchId ?? branchId,
      status,
      feePlan: feePlan.trim(),
      allergies: allergies.trim(),
    });
    toast.success("Student updated");
    onClose();
  };

  return (
    <ModalPortal open={open && !!student} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex shrink-0 items-start justify-between border-b border-[#F1F3F5] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-heading">
            <Pencil className="h-5 w-5 text-brand-500" />
            Edit Student
          </h2>
          {student && (
            <p className="mt-1 text-sm text-muted">
              {student.firstName} {student.lastName}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-bg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="editFirstName">First name</Label>
            <Input id="editFirstName" className="mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="editLastName">Last name</Label>
            <Input id="editLastName" className="mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="editDob">Date of birth</Label>
            <Input id="editDob" type="date" className="mt-1" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="editBlood">Blood group</Label>
            <Input id="editBlood" className="mt-1" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StudentStatus)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="pending_first_payment">Pending payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Class</Label>
          <Select
            value={classId}
            onValueChange={(v) => {
              setClassId(v);
              const cls = classes.find((c) => c.id === v);
              if (cls) setBranchId(cls.branchId);
            }}
          >
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({branches.find((b) => b.id === c.branchId)?.name.replace(" Campus", "")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="editFeePlan">Fee plan</Label>
          <Input id="editFeePlan" className="mt-1" value={feePlan} onChange={(e) => setFeePlan(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="editAllergies">Allergies (comma-separated)</Label>
          <Input id="editAllergies" className="mt-1" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Peanuts, Dairy" />
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={handleSave}>Save changes</Button>
      </div>
    </ModalPortal>
  );
}
