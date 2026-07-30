import type { PortalIdCard } from "@/types";
import { buildStaffIdCard, buildStudentIdCard } from "@/lib/id-card";
import { students } from "@/data/students";
import { staff } from "@/data/staff";

/** In-memory registry of issued portal ID cards (mock DB) */
export const issuedIdCards: PortalIdCard[] = [];

function upsertCard(card: PortalIdCard) {
  const idx = issuedIdCards.findIndex((c) => c.id === card.id);
  if (idx >= 0) issuedIdCards[idx] = card;
  else issuedIdCards.unshift(card);
  return card;
}

/**
 * Issue student ID card when enrollment saves the student into the portal.
 * TODO: Replace with API POST /api/id-cards/student
 */
export async function issueStudentIdCard(studentId: string): Promise<PortalIdCard | null> {
  const student = students.find((s) => s.id === studentId);
  if (!student) return null;
  if (!student.idCardNumber) {
    const { generateStudentCardNumber } = await import("@/lib/id-card");
    student.idCardNumber = generateStudentCardNumber(student.id);
  }
  return upsertCard(buildStudentIdCard(student));
}

/**
 * Issue staff ID card when hire saves the employee into the portal.
 * TODO: Replace with API POST /api/id-cards/staff
 */
export async function issueStaffIdCard(staffId: string): Promise<PortalIdCard | null> {
  const member = staff.find((s) => s.id === staffId);
  if (!member) return null;
  if (!member.idCardNumber) {
    const { generateStaffCardNumber } = await import("@/lib/id-card");
    member.idCardNumber = generateStaffCardNumber(member.employeeId);
  }
  return upsertCard(buildStaffIdCard(member));
}

export async function getIdCardByPerson(
  kind: "student" | "staff",
  personId: string
): Promise<PortalIdCard | undefined> {
  const existing = issuedIdCards.find((c) => c.kind === kind && c.personId === personId);
  if (existing) return existing;
  if (kind === "student") {
    const s = students.find((x) => x.id === personId);
    if (s?.idCardNumber) return upsertCard(buildStudentIdCard(s));
  } else {
    const m = staff.find((x) => x.id === personId);
    if (m?.idCardNumber) return upsertCard(buildStaffIdCard(m));
  }
  return undefined;
}
