/**
 * SDLC printable letters & certificates for students and staff.
 * Enrollment letter body matches "SDLC - Child Enrollment Letter.docx".
 */

export type LetterAudience = "student" | "staff";

export type LetterKind =
  // Student
  | "enrollment_letter"
  | "leaving_certificate"
  | "clearance_certificate"
  | "character_certificate"
  // Staff
  | "experience_letter"
  | "job_offer_letter"
  | "promotion_letter"
  | "salary_revision_letter"
  | "resignation_acceptance"
  | "termination_letter"
  | "retirement_letter"
  | "correction_letter";

export type LetterFieldKey =
  | "branchName"
  | "grNumber"
  | "childFullName"
  | "dateOfBirth"
  | "fatherName"
  | "joiningGrade"
  | "joiningDate"
  | "letterDate"
  | "coordinatorName"
  | "leaveDate"
  | "className"
  | "feePlan"
  | "staffName"
  | "employeeId"
  | "designation"
  | "joinDate"
  | "endDate"
  | "salary"
  | "newDesignation"
  | "effectiveDate"
  | "reason"
  | "issueDate";

export interface LetterTemplate {
  kind: LetterKind;
  audience: LetterAudience;
  title: string;
  subtitle: string;
  /** Fields shown in the generator form */
  fields: LetterFieldKey[];
  /** Body paragraphs — use {{fieldKey}} placeholders */
  paragraphs: string[];
  closing?: string[];
  /** Certificate-style bordered layout vs letter */
  style: "letter" | "certificate";
}

export type LetterValues = Partial<Record<LetterFieldKey, string>>;

export interface IssuedLetter {
  id: string;
  kind: LetterKind;
  audience: LetterAudience;
  subjectId: string;
  subjectName: string;
  values: LetterValues;
  issuedAt: string;
  issuedBy: string;
}
