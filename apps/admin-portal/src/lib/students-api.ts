import type { Parent, Student, StudentStatus } from "@/types";

/**
 * KinderPilot students (`/api/v1/students`) and the per-student fee endpoints
 * (`/fees/students/{id}/subscriptions`, `/balance`), reached through `/api/bff`.
 * Shapes copied from the backend's OpenAPI spec.
 */

/** `StudentDetailResponse` */
export type ApiStudent = {
  id: number;
  studentCode?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  inquiryId?: number | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GDPR_ANONYMIZED" | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  previousSchool?: string | null;
  fatherName?: string | null;
  fatherCnic?: string | null;
  fatherPhone?: string | null;
  fatherEmail?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherCnic?: string | null;
  motherPhone?: string | null;
  motherEmail?: string | null;
  motherOccupation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  pediatricianName?: string | null;
  pediatricianPhone?: string | null;
  specialMedicalNotes?: string | null;
  medicalInfo?: string | null;
  program?: string | null;
  shiftType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  bformNumber?: string | null;
};

const STATUS_FROM_API: Record<string, StudentStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "inactive",
  GDPR_ANONYMIZED: "inactive",
};

/** API students have numeric ids; the remaining mock screens use string ids like "s1". */
export const isApiStudentId = (id: string) => /^\d{1,18}$/.test(id);

const NO_ALLERGY = /^(none|no|n\/a|nil|-)?$/i;

/** An API student in the shape the student table and profile render. */
export function studentFromApi(s: ApiStudent): Student {
  const id = String(s.id);
  return {
    id,
    firstName: s.firstName?.trim() || "—",
    lastName: s.lastName?.trim() || "",
    dob: s.dateOfBirth ?? "",
    bloodGroup: s.bloodGroup || "—",
    allergies: (s.allergies ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter((a) => !NO_ALLERGY.test(a)),
    branchId: s.branchId ?? "",
    classId: s.program ?? "",
    className: s.program || "—",
    enrollmentDate: s.createdAt ?? "",
    status: STATUS_FROM_API[s.status ?? ""] ?? "active",
    parentIds: [s.fatherName && `${id}-father`, s.motherName && `${id}-mother`].filter((p): p is string => !!p),
    gender: s.gender?.toUpperCase().startsWith("F") ? "female" : "male",
    grNumber: s.studentCode ?? undefined,
    feePlan: s.shiftType ?? undefined,
  };
}

/** Father / mother from the student record (the API has no separate parent entity yet). */
export function parentsFromApi(s: ApiStudent): Parent[] {
  const id = String(s.id);
  const parents: Parent[] = [];
  if (s.fatherName) {
    parents.push({
      id: `${id}-father`,
      name: s.fatherName,
      relation: "father",
      phone: s.fatherPhone ?? "",
      email: s.fatherEmail ?? "",
      cnic: s.fatherCnic ?? undefined,
    });
  }
  if (s.motherName) {
    parents.push({
      id: `${id}-mother`,
      name: s.motherName,
      relation: "mother",
      phone: s.motherPhone ?? "",
      email: s.motherEmail ?? "",
      cnic: s.motherCnic ?? undefined,
    });
  }
  return parents;
}

/* ── Service subscriptions (`/fees/students/{id}/subscriptions`) ── */

export type SubscriptionStatus = "PENDING" | "ACTIVE" | "PAUSED" | "CANCELLED";

/** `SubscriptionResponse` */
export type ApiSubscription = {
  id: number;
  studentId?: number | null;
  feeStructureId?: number | null;
  serviceName?: string | null;
  serviceType?: string | null;
  billingCycle?: string | null;
  effectivePrice?: number | null;
  status?: SubscriptionStatus | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  addedBy?: string | null;
  createdAt?: string | null;
};

/** `AddServiceSubscriptionRequest` — the price comes from the fee structure; the API takes no custom price. */
export type AddSubscription = { feeStructureId: number; startDate?: string; notes?: string };

export const subscriptionsPath = (studentId: string) =>
  `/fees/students/${encodeURIComponent(studentId)}/subscriptions`;

/* ── Credit balance ledger (`/fees/students/{id}/balance`) ── */

export type LedgerTransactionType =
  | "ADVANCE_PAYMENT"
  | "CREDIT_ADJUSTMENT"
  | "CHALLAN_DEBIT"
  | "REFUND"
  | "OVERPAYMENT_CREDIT";

export const LEDGER_TYPE_LABELS: Record<LedgerTransactionType, string> = {
  ADVANCE_PAYMENT: "Advance payment",
  CREDIT_ADJUSTMENT: "Credit adjustment",
  CHALLAN_DEBIT: "Applied to challan",
  REFUND: "Refund",
  OVERPAYMENT_CREDIT: "Overpayment credit",
};

/** Types staff record by hand — challan debits are written by challan generation. */
export const MANUAL_LEDGER_TYPES: LedgerTransactionType[] = [
  "ADVANCE_PAYMENT",
  "OVERPAYMENT_CREDIT",
  "CREDIT_ADJUSTMENT",
  "REFUND",
];

/** `LedgerEntryDto` */
export type ApiLedgerEntry = {
  id: number;
  amount?: number | null;
  transactionType?: LedgerTransactionType | null;
  challanNumber?: string | null;
  description?: string | null;
  recordedBy?: string | null;
  createdAt?: string | null;
};

/** `StudentBalanceSummaryResponse` — `currentBalance` > 0 means the student has credit. */
export type ApiStudentBalance = {
  studentId?: number | null;
  companyId?: string | null;
  branchId?: string | null;
  currentBalance?: number | null;
  ledger?: ApiLedgerEntry[] | null;
};

export const balancePath = (studentId: string) => `/fees/students/${encodeURIComponent(studentId)}/balance`;

/* ── Transfers (`/admissions/transfers/*`) ── */

/** `TransferResponse` */
export type ApiTransfer = {
  transferType?: string | null;
  entityId?: number | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  status?: string | null;
  message?: string | null;
  processedAt?: string | null;
};

/** `ClassroomResponse` from `GET /hierarchy/branches/{branchId}/classrooms` */
export type ApiClassroom = {
  id: number;
  branchId?: number | null;
  name?: string | null;
  code?: string | null;
  ageGroupOrGrade?: string | null;
  capacity?: number | null;
  availableSeats?: number | null;
  hasVacancy?: boolean | null;
  active?: boolean | null;
};
