import type { Staff, StaffStatus, Student, StudentStatus } from "@/types";

/** Students who may receive new invoices / fee entries */
export function isBillableStudentStatus(status: StudentStatus): boolean {
  return status === "active" || status === "pending_first_payment";
}

export function isBillableStudent(student: Pick<Student, "status">): boolean {
  return isBillableStudentStatus(student.status);
}

/** Staff who may appear on payroll and new HR financial entries */
export function isPayableStaffStatus(status: StaffStatus): boolean {
  return status === "active";
}

export function isPayableStaff(member: Pick<Staff, "status">): boolean {
  return isPayableStaffStatus(member.status);
}

export function inactiveStudentMessage(status: StudentStatus): string {
  if (status === "inactive") {
    return "Student is inactive — no new invoices or fee entries can be created.";
  }
  if (status === "alumni") {
    return "Student is alumni — no new invoices can be created.";
  }
  if (status === "waitlist" || status === "inquiry") {
    return "Student is not enrolled — no invoices until enrollment.";
  }
  return "Student is not eligible for billing.";
}

export function inactiveStaffMessage(status: StaffStatus): string {
  if (status === "resigned") {
    return "Staff resigned — excluded from payroll and new entries.";
  }
  if (status === "fired") {
    return "Staff terminated — excluded from payroll and new entries.";
  }
  return "Staff is inactive — excluded from payroll and new entries.";
}
