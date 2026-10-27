import type {
  AdmissionCard,
  AdmissionStage,
  AdmissionTag,
  DiscountType,
  InquirySource,
  MeetingKind,
} from "@/types";

/**
 * KinderPilot admissions API (`/api/v1/admissions/*`, reached through `/api/bff`):
 * response shapes from the backend's OpenAPI spec and mapping to the UI's AdmissionCard.
 */

export type ApiPipelineStage =
  | "NEW_INQUIRY"
  | "TOUR_SCHEDULED"
  | "PENDING_BRANCH_FEE_APPROVAL"
  | "BRANCH_FEE_APPROVED"
  | "HO_FEE_LOCK"
  | "ENROLLED_UNPAID"
  | "ENROLLED"
  | "WAITLIST"
  | "REJECTED"
  | "CLOSED";

export type ApiMeetingType = "CAMPUS_TOUR" | "PARENT_INTERVIEW" | "ASSESSMENT";
export type ApiDiscountType = "NO_DISCOUNT" | "PERCENTAGE" | "FIXED_AMOUNT" | "SIBLING";

/** `InquiryResponse` — also the common subset of `KanbanCardDto`. */
export type ApiInquiry = {
  id: number;
  companyId?: string | null;
  branchId?: string | null;
  childName?: string | null;
  childDob?: string | null;
  gender?: string | null;
  gradeOrProgram?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  stage: ApiPipelineStage;
  source?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ApiInquiryMeeting = {
  id: number;
  meetingType?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  locationOrClassroom?: string | null;
  status?: string | null;
  notes?: string | null;
};

/** `UpdateInquiryMeetingRequest` — body of `PUT /admissions/inquiries/{id}/meetings/{meetingId}`. */
export type MeetingUpdate = {
  meetingType: ApiMeetingType;
  scheduledDate: string;
  scheduledTime: string;
  locationOrClassroom?: string;
  status: string;
  notes?: string;
};

export const MEETING_STATUSES = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "RESCHEDULED", label: "Rescheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No show" },
] as const;

/** `InquiryResponse` from `GET /admissions/inquiries/{id}` — carries meetings, fees and challan. */
export type ApiInquiryDetail = ApiInquiry & {
  priorityBadge?: string | null;
  meetingType?: string | null;
  meetingDate?: string | null;
  meetingTime?: string | null;
  meetingLocation?: string | null;
  meetingStatus?: string | null;
  meetingNotes?: string | null;
  meetings?: ApiInquiryMeeting[] | null;
  feeLockId?: number | null;
  monthlyTuition?: number | null;
  admissionFee?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  netAmount?: number | null;
  feeNotes?: string | null;
  feeApprovalStatus?: string | null;
  challanNumber?: string | null;
  challanDueDate?: string | null;
  challanStatus?: string | null;
  enrollmentToken?: string | null;
  paymentUrl?: string | null;
  enrollmentWizardUrl?: string | null;
};

export type ApiKanbanCard = ApiInquiry & {
  priorityBadge?: string | null;
  daysInCurrentStage?: number | null;
  ageYears?: number | null;
  monthlyTuition?: number | null;
  admissionFee?: number | null;
  netAmount?: number | null;
  challanNumber?: string | null;
  challanStatus?: string | null;
  meetingType?: string | null;
  meetingDate?: string | null;
  meetingLocation?: string | null;
  stageUpdatedAt?: string | null;
};

export type ApiKanbanBoard = {
  newInquiryColumn?: ApiKanbanCard[];
  tourScheduledColumn?: ApiKanbanCard[];
  hoFeeLockColumn?: ApiKanbanCard[];
  enrolUnpaidColumn?: ApiKanbanCard[];
  enrolledColumn?: ApiKanbanCard[];
  waitlistColumn?: ApiKanbanCard[];
  totalLeadsCount?: number;
  hotLeadsCount?: number;
};

export type ApiFeeLock = {
  feeLockId: number;
  inquiryId: number;
  approvalStatus?: string | null;
  challanNumber?: string | null;
  netAmount?: number | null;
  /** Issued by the Head Office lock; the parent's wizard link and document uploads use it */
  enrollmentToken?: string | null;
  tokenExpiresAt?: string | null;
  emailSent?: boolean;
};

export type ApiStudentConversion = {
  studentId: number;
  studentCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
  inquiryId?: number | null;
  challanNumber?: string | null;
  paidAt?: string | null;
  message?: string | null;
};

/** `FeeApprovalTicketDto` — rows of the branch and Head Office fee approval queues. */
export type ApiFeeApprovalTicket = {
  inquiryId: number;
  feeLockId?: number | null;
  childName?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  branchId?: string | null;
  companyId?: string | null;
  gradeOrProgram?: string | null;
  monthlyTuition?: number | null;
  admissionFee?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  netAmount?: number | null;
  feeNotes?: string | null;
  approvalStatus?: string | null;
  pipelineStage?: string | null;
  proposedBy?: string | null;
  proposedAt?: string | null;
  branchApprovedBy?: string | null;
  branchApprovedAt?: string | null;
  hoApprovedBy?: string | null;
  hoApprovedAt?: string | null;
};

/** `GeneratePaymentUrlResponse` */
export type ApiPaymentUrl = {
  inquiryId: number;
  challanNumber?: string | null;
  amountDue?: number | null;
  dueDate?: string | null;
  paymentStatus?: string | null;
  enrollmentToken?: string | null;
  paymentUrl?: string | null;
  enrollmentWizardUrl?: string | null;
  expiresAt?: string | null;
  emailSent?: boolean;
  message?: string | null;
};

/** `FullManualEnrollmentResponse` */
export type ApiFullManualEnrollment = {
  inquiryId: number;
  submissionId?: number | null;
  feeLockId?: number | null;
  challanNumber?: string | null;
  netAmount?: number | null;
  challanStatus?: string | null;
  stage?: string | null;
  studentId?: number | null;
  studentCode?: string | null;
  studentStatus?: string | null;
  message?: string | null;
};

export type ApiPaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE_GATEWAY";

export const PAYMENT_METHODS: { value: ApiPaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE_GATEWAY", label: "Online gateway" },
];

/** `PaymentConfirmationRequest` — body of `mark-paid` and the full-manual `paymentDetails`. */
export type PaymentConfirmation = {
  paymentMethod: ApiPaymentMethod;
  transactionReference?: string;
  amountPaid?: number;
  paymentNotes?: string;
};

/** Backend stage → Kanban column. REJECTED / CLOSED have no column. */
const STAGE_FROM_API: Partial<Record<ApiPipelineStage, AdmissionStage>> = {
  NEW_INQUIRY: "new_inquiry",
  TOUR_SCHEDULED: "meeting_test_scheduled",
  PENDING_BRANCH_FEE_APPROVAL: "pending_ho_fee",
  BRANCH_FEE_APPROVED: "pending_ho_fee",
  HO_FEE_LOCK: "pending_ho_fee",
  ENROLLED_UNPAID: "enrol_unpaid",
  ENROLLED: "paid",
  WAITLIST: "waitlist",
};

const MEETING_FROM_API: Record<string, MeetingKind> = {
  CAMPUS_TOUR: "tour",
  PARENT_INTERVIEW: "interview",
  ASSESSMENT: "assessment",
};

const MEETING_TO_API: Record<MeetingKind, ApiMeetingType> = {
  tour: "CAMPUS_TOUR",
  interview: "PARENT_INTERVIEW",
  test: "ASSESSMENT",
  assessment: "ASSESSMENT",
};


function sourceFromApi(source: string | null | undefined): InquirySource | undefined {
  if (!source) return undefined;
  const s = source.toUpperCase();
  if (s.includes("INSTAGRAM")) return "instagram";
  if (s.includes("FACEBOOK")) return "facebook";
  if (s.includes("WHATSAPP")) return "whatsapp";
  if (s.includes("WALK")) return "walk_in";
  if (s.includes("REFERRAL")) return "referral";
  if (s.includes("WEB") || s.includes("ONLINE")) return "website";
  return "other";
}

function tagFromApi(card: ApiKanbanCard): AdmissionTag {
  if (card.priorityBadge?.toUpperCase().includes("HOT")) return "hot_lead";
  const source = sourceFromApi(card.source);
  if (source === "walk_in") return "walk_in";
  if (source === "referral") return "referral";
  return "online";
}

function ageFromDob(dob: string | null | undefined): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

/**
 * The public employment form files candidates as admissions inquiries — they
 * belong on the HR Staff Inquiries board, not the student pipeline.
 */
export function isStaffApplication(card: ApiKanbanCard): boolean {
  return (
    !!card.source?.toUpperCase().includes("EMPLOYMENT") ||
    !!card.priorityBadge?.toUpperCase().includes("EMPLOYMENT")
  );
}

/** Works for both `KanbanCardDto` and the slimmer `InquiryResponse`. */
export function toAdmissionCard(card: ApiKanbanCard): AdmissionCard | null {
  const stage = STAGE_FROM_API[card.stage];
  if (!stage) return null;
  const createdAt = card.createdAt ?? "";
  return {
    id: String(card.id),
    studentName: card.childName?.trim() || "Unnamed child",
    age: card.ageYears ?? ageFromDob(card.childDob),
    parentName: card.parentName ?? "",
    program: card.gradeOrProgram ?? "—",
    branchId: card.branchId ?? "",
    stage,
    daysInStage: card.daysInCurrentStage ?? daysSince(card.stageUpdatedAt ?? card.updatedAt),
    createdAt: createdAt.slice(0, 10),
    inquiryTime: createdAt.slice(11, 16),
    tag: tagFromApi(card),
    type: card.source?.toUpperCase().includes("TOUR") ? "tour" : "admission",
    description: card.notes ?? "",
    email: card.parentEmail ?? "",
    parentEmail: card.parentEmail ?? undefined,
    parentPhone: card.parentPhone ?? undefined,
    monthlyTuition: card.monthlyTuition ?? undefined,
    admissionFee: card.admissionFee ?? undefined,
    netAmount: card.netAmount ?? undefined,
    invoiceNumber: card.challanNumber ?? undefined,
    meetingKind: card.meetingType ? MEETING_FROM_API[card.meetingType] : undefined,
    meetingDate: card.meetingDate ?? undefined,
    meetingLocation: card.meetingLocation ?? undefined,
    inquirySource: sourceFromApi(card.source),
    childDob: card.childDob ?? undefined,
    apiStage: card.stage,
  };
}

export function kanbanToCards(board: ApiKanbanBoard): AdmissionCard[] {
  const seen = new Set<number>();
  const cards: AdmissionCard[] = [];
  for (const column of [
    board.newInquiryColumn,
    board.waitlistColumn,
    board.tourScheduledColumn,
    board.hoFeeLockColumn,
    board.enrolUnpaidColumn,
    board.enrolledColumn,
  ]) {
    for (const item of column ?? []) {
      if (seen.has(item.id) || isStaffApplication(item)) continue;
      seen.add(item.id);
      const card = toAdmissionCard(item);
      if (card) cards.push(card);
    }
  }
  return cards;
}

/** Body for `POST /admissions/inquiries/{id}/schedule-tour`. */
export function scheduleTourBody(values: {
  meetingKind: MeetingKind;
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  meetingNotes: string;
}) {
  return {
    meetingType: MEETING_TO_API[values.meetingKind],
    scheduledDate: values.meetingDate,
    scheduledTime: values.meetingTime.length === 5 ? `${values.meetingTime}:00` : values.meetingTime,
    locationOrClassroom: values.meetingLocation,
    notes: values.meetingNotes || undefined,
  };
}

/**
 * Why an inquiry cannot wait on payment yet: fees are proposed (3a), approved by
 * the branch admin (3b), then approved and locked by the company / Head Office (3c).
 */
export function feeApprovalBlocker(stage: string | undefined): string {
  switch (stage) {
    case "PENDING_BRANCH_FEE_APPROVAL":
      return "The proposed fees are waiting for branch approval, then company (Head Office) approval.";
    case "BRANCH_FEE_APPROVED":
    case "HO_FEE_LOCK":
      return "The branch has approved the fees — they are now waiting for company (Head Office) approval.";
    default:
      return "Propose the fees first, then get them approved by the branch and by the company (Head Office).";
  }
}

/** Public `/enroll/{token}` page on this host — the parent's enrollment form. */
export function enrollmentFormUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/enroll/${encodeURIComponent(token)}`;
}

/* ── Dynamic fee proposal (`/fees/structures/*`, `calculate-fees`, `propose-fees`) ── */

/** `FeeStructureResponse` — one core fee of a program (tuition, admission, …). */
export type ApiFeeStructure = {
  id: number;
  gradeOrProgram?: string | null;
  serviceType?: string | null;
  feeName?: string | null;
  billingCycle?: string | null;
  baseAmount?: number | null;
};

/** `AdditionalServiceOption` — optional add-on (Quran, transport, extended daycare…). */
export type ApiAdditionalService = {
  id: number;
  feeName?: string | null;
  serviceType?: string | null;
  billingCycle?: string | null;
  baseAmount?: number | null;
};

/** `ProgramFeeSummaryResponse` from `GET /fees/structures/programs`. */
export type ApiProgramFeeSummary = {
  companyCode?: string | null;
  branchCode?: string | null;
  programs?: {
    gradeOrProgram: string;
    coreFees?: ApiFeeStructure[] | null;
    totalMonthlyAmount?: number | null;
    totalOneTimeAmount?: number | null;
  }[];
  additionalServices?: ApiAdditionalService[] | null;
};

/** `FeeDiscountResponse` from `GET /fees/discounts`. */
export type ApiFeeDiscount = {
  id: number;
  name?: string | null;
  discountCode: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  discountValue?: number | null;
  applicableServiceType?: string | null;
  applicableGrade?: string | null;
  active?: boolean;
};

/** `ChallanLineItemDto` (older responses used feeName / amount). */
export type ApiFeeLine = {
  feeStructureId?: number | null;
  lineDescription?: string | null;
  feeName?: string | null;
  serviceType?: string | null;
  billingCycle?: string | null;
  unitPrice?: number | null;
  lineDiscount?: number | null;
  lineTotal?: number | null;
  amount?: number | null;
};

/** `DynamicFeeProposalResponse` — from `calculate-fees` (DRAFT) and `propose-fees`. */
export type ApiFeeProposal = {
  feeLockId?: number | null;
  inquiryId: number;
  resolvedProgram?: string | null;
  resolvedBranchCode?: string | null;
  lineItems?: ApiFeeLine[] | null;
  discounts?:
    | {
        discountCode?: string | null;
        name?: string | null;
        discountType?: string | null;
        discountValue?: number | null;
        calculatedDiscountAmount?: number | null;
      }[]
    | null;
  grossAmount?: number | null;
  totalDiscount?: number | null;
  netAmount?: number | null;
  monthlyRecurringAmount?: number | null;
  oneTimeAmount?: number | null;
  approvalStatus?: string | null;
  pipelineStage?: string | null;
  feeNotes?: string | null;
};

/** What staff pick in the propose-fees dialog — amounts always come from the fee structures. */
export type FeeSelection = {
  gradeOrProgram: string;
  branchCode?: string;
  additionalServiceIds: number[];
  discountCodes: string[];
  notes: string;
};

/** `InquiryFeeCalculationRequest` — body of `calculate-fees` (preview, saves a DRAFT). */
export function calculateFeesBody(s: FeeSelection) {
  return {
    gradeOrProgram: s.gradeOrProgram,
    branchCode: s.branchCode || undefined,
    additionalServiceIds: s.additionalServiceIds,
    discountCodes: s.discountCodes,
    notes: s.notes || undefined,
  };
}

/** `ProposeFeesRequest` — body of `propose-fees` (3a → PENDING_BRANCH_FEE_APPROVAL). */
export function proposeFeesBody(s: FeeSelection) {
  return {
    gradeOrProgram: s.gradeOrProgram,
    branchCode: s.branchCode || undefined,
    additionalServiceIds: s.additionalServiceIds,
    discountCodes: s.discountCodes,
    feeNotes: s.notes || undefined,
  };
}

/** Same program name, ignoring case and spacing (inquiries store free text). */
export function sameProgram(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (v: string | null | undefined) => (v ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  return !!a && !!b && norm(a) === norm(b);
}

const DISCOUNT_FROM_API: Record<string, DiscountType> = {
  NO_DISCOUNT: "none",
  PERCENTAGE: "percent",
  FIXED_AMOUNT: "fixed",
  SIBLING: "sibling",
};

/** A proposed fee package (ticket or inquiry detail) as fee form values. */
export function feeValuesFrom(fees: {
  monthlyTuition?: number | null;
  admissionFee?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  feeNotes?: string | null;
}) {
  return {
    monthlyTuition: fees.monthlyTuition ?? 0,
    admissionFee: fees.admissionFee ?? 0,
    discountType: DISCOUNT_FROM_API[fees.discountType ?? ""] ?? "none",
    discountValue: fees.discountValue ?? 0,
    feeNotes: fees.feeNotes ?? "",
  };
}

export const DISCOUNT_LABELS_API: Record<string, string> = {
  NO_DISCOUNT: "No discount",
  PERCENTAGE: "Percent",
  FIXED_AMOUNT: "Fixed amount",
  SIBLING: "Sibling",
};

/** Message from a failed BFF call — the backend sends `{ message }`, the BFF `{ error }`. */
export function apiErrorMessage(error: unknown, fallback = "Request failed."): string {
  const body = (error as { body?: { message?: unknown; error?: unknown } } | null)?.body;
  if (typeof body?.message === "string" && body.message) return body.message;
  if (typeof body?.error === "string" && body.error) return body.error;
  const status = (error as { status?: number } | null)?.status;
  return status ? `${fallback} (HTTP ${status})` : fallback;
}
