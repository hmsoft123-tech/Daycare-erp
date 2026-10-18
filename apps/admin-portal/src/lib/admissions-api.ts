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
  message?: string | null;
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

/** The API has four discount kinds; scholarship / staff / promo go as a fixed amount. */
const DISCOUNT_TO_API: Record<DiscountType, ApiDiscountType> = {
  none: "NO_DISCOUNT",
  percent: "PERCENTAGE",
  fixed: "FIXED_AMOUNT",
  sibling: "SIBLING",
  scholarship: "FIXED_AMOUNT",
  staff: "FIXED_AMOUNT",
  promo: "FIXED_AMOUNT",
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
    invoiceNumber: card.challanNumber ?? undefined,
    meetingKind: card.meetingType ? MEETING_FROM_API[card.meetingType] : undefined,
    meetingDate: card.meetingDate ?? undefined,
    meetingLocation: card.meetingLocation ?? undefined,
    inquirySource: sourceFromApi(card.source),
    childDob: card.childDob ?? undefined,
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

/** Body for `POST /admissions/inquiries/{id}/propose-fees` and `/lock-fees`. */
export function feesBody(values: {
  monthlyTuition: number;
  admissionFee: number;
  discountType: DiscountType;
  discountValue: number;
  feeNotes: string;
}) {
  return {
    monthlyTuition: values.monthlyTuition,
    admissionFee: values.admissionFee,
    discountType: DISCOUNT_TO_API[values.discountType],
    discountValue: values.discountValue,
    feeNotes: values.feeNotes || undefined,
  };
}

/** Message from a failed BFF call — the backend sends `{ message }`, the BFF `{ error }`. */
export function apiErrorMessage(error: unknown, fallback = "Request failed."): string {
  const body = (error as { body?: { message?: unknown; error?: unknown } } | null)?.body;
  if (typeof body?.message === "string" && body.message) return body.message;
  if (typeof body?.error === "string" && body.error) return body.error;
  const status = (error as { status?: number } | null)?.status;
  return status ? `${fallback} (HTTP ${status})` : fallback;
}
