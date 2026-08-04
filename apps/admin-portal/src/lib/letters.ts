import { branches } from "@/data/branches";
import { parents } from "@/data/students";
import { formatChallanDate } from "@/lib/fee-challan";
import type { Staff, Student } from "@/types";
import type { LetterKind, LetterValues } from "@/types/letters";

export function todayLetterDate(): string {
  return formatChallanDate(new Date().toISOString().slice(0, 10));
}

export function prefillStudentLetter(student: Student, kind: LetterKind): LetterValues {
  const branch = branches.find((b) => b.id === student.branchId);
  const father =
    parents.find((p) => student.parentIds.includes(p.id) && p.relation === "father") ??
    parents.find((p) => student.parentIds.includes(p.id));
  const base: LetterValues = {
    branchName: branch?.name ?? "",
    grNumber: student.idCardNumber?.replace(/\D/g, "").slice(-5) || student.id.replace(/\D/g, "") || "—",
    childFullName: `${student.firstName} ${student.lastName}`,
    dateOfBirth: student.dob,
    fatherName: father?.name ?? "",
    joiningGrade: student.className,
    joiningDate: student.enrollmentDate,
    className: student.className,
    feePlan: student.feePlan ?? "",
    leaveDate: student.leaveDate ?? "",
    letterDate: todayLetterDate(),
    issueDate: todayLetterDate(),
    coordinatorName: "Center Coordinator",
  };
  if (kind === "leaving_certificate" && !base.leaveDate) {
    base.leaveDate = new Date().toISOString().slice(0, 10);
  }
  return base;
}

export function prefillStaffLetter(member: Staff, kind: LetterKind): LetterValues {
  const branch = branches.find((b) => b.id === member.branchId);
  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    teacher: "Teacher",
    therapist: "Therapist",
    accountant: "Accountant",
    support: "Support Staff",
    executive: "Executive",
  };
  return {
    branchName: branch?.name ?? "",
    staffName: member.name,
    employeeId: member.employeeId,
    designation: roleLabels[member.role] ?? member.role,
    joinDate: member.joinDate,
    endDate: member.endDate ?? new Date().toISOString().slice(0, 10),
    salary: member.salary?.baseSalary ? String(member.salary.baseSalary) : "",
    newDesignation: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "",
    issueDate: todayLetterDate(),
    letterDate: todayLetterDate(),
    coordinatorName: "HR / Center Coordinator",
  };
}
