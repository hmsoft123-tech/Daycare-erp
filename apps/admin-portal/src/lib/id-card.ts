import { branches } from "@/data/branches";
import type { PortalIdCard, Staff, Student } from "@/types";

function pad(n: number, width = 4) {
  return String(n).padStart(width, "0");
}

export function generateStudentCardNumber(seed?: string): string {
  const year = new Date().getFullYear();
  const num =
    seed?.replace(/\D/g, "").slice(-4) ||
    String(Math.floor(1000 + Math.random() * 9000));
  return `STU-${year}-${pad(Number(num) || Math.floor(1000 + Math.random() * 9000))}`;
}

export function generateStaffCardNumber(employeeId?: string): string {
  const year = new Date().getFullYear();
  if (employeeId) {
    const digits = employeeId.replace(/\D/g, "").slice(-4) || "0001";
    return `EMP-${year}-${pad(Number(digits))}`;
  }
  return `EMP-${year}-${pad(Math.floor(1000 + Math.random() * 9000))}`;
}

function branchName(branchId: string) {
  return branches.find((b) => b.id === branchId)?.name ?? "Campus";
}

function validUntilFrom(issuedAt: string) {
  const d = new Date(issuedAt);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Build student ID card when enrollment saves the student into the portal */
export function buildStudentIdCard(
  student: Pick<
    Student,
    "id" | "firstName" | "lastName" | "photo" | "branchId" | "className" | "bloodGroup" | "idCardNumber" | "dob"
  >,
  issuedAt = new Date().toISOString().slice(0, 10)
): PortalIdCard {
  const cardNumber = student.idCardNumber ?? generateStudentCardNumber(student.id);
  return {
    id: `idc-stu-${student.id}`,
    kind: "student",
    cardNumber,
    personId: student.id,
    fullName: `${student.firstName} ${student.lastName}`,
    photo: student.photo,
    branchId: student.branchId,
    branchName: branchName(student.branchId),
    subtitle: student.className,
    secondaryLine: student.dob ? `DOB ${student.dob}` : undefined,
    issuedAt,
    validUntil: validUntilFrom(issuedAt),
    bloodGroup: student.bloodGroup,
  };
}

/** Build staff ID card when hire saves the employee into the portal */
export function buildStaffIdCard(
  member: Pick<
    Staff,
    "id" | "name" | "photo" | "branchId" | "role" | "employeeId" | "idCardNumber"
  >,
  issuedAt = new Date().toISOString().slice(0, 10)
): PortalIdCard {
  const cardNumber = member.idCardNumber ?? generateStaffCardNumber(member.employeeId);
  const roleLabel =
    member.role.charAt(0).toUpperCase() + member.role.slice(1).replace("_", " ");
  return {
    id: `idc-stf-${member.id}`,
    kind: "staff",
    cardNumber,
    personId: member.id,
    fullName: member.name,
    photo: member.photo,
    branchId: member.branchId,
    branchName: branchName(member.branchId),
    subtitle: roleLabel,
    secondaryLine: member.employeeId,
    issuedAt,
    validUntil: validUntilFrom(issuedAt),
    employeeId: member.employeeId,
  };
}
