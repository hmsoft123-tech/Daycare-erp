import type {
  EducationRow,
  JobApplicationForm,
  StaffInquiryCard,
  StaffInquiryStage,
  StaffInquiryTag,
  StaffInterviewKind,
  StaffRole,
} from "@/types";
import {
  isStaffApplication,
  type ApiKanbanBoard,
  type ApiKanbanCard,
  type ApiMeetingType,
  type ApiPipelineStage,
} from "@/lib/admissions-api";
import { COMPANY_ID } from "@/lib/enrollment-api";

/**
 * Staff hiring on the KinderPilot API. There is no HR module yet: the public
 * employment form (`POST /public/forms/employment-application`) files the
 * candidate as an admissions inquiry with source `WEBSITE_EMPLOYMENT_APPLICATION`,
 * `gradeOrProgram: "Position: …"` and `notes: "Qualification: … | Experience: … | …"`.
 * Those inquiries reuse the admissions steps: schedule-tour (interview) and waitlist (talent pool).
 */

/** Backend stage → hiring column. Fee / payment stages have no hiring meaning, so they read as an offer. */
const STAGE_FROM_API: Partial<Record<ApiPipelineStage, StaffInquiryStage>> = {
  NEW_INQUIRY: "new_inquiry",
  TOUR_SCHEDULED: "interview_scheduled",
  PENDING_BRANCH_FEE_APPROVAL: "offer_pending",
  BRANCH_FEE_APPROVED: "offer_pending",
  HO_FEE_LOCK: "offer_pending",
  ENROLLED_UNPAID: "offer_pending",
  ENROLLED: "hired",
  WAITLIST: "waitlist",
};

const ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "Teacher",
  therapist: "Therapist",
  admin: "Admin",
  support: "Support",
  accountant: "Accountant",
  executive: "Executive",
};

const TAG_LABELS: Record<StaffInquiryTag, string> = {
  hot_lead: "Hot lead",
  referral: "Referral",
  walk_in: "Walk-in",
  online: "Online",
  campus_posting: "Campus posting",
  agency: "Agency",
};

const INTERVIEW_LABELS: Record<StaffInterviewKind, string> = {
  phone: "Phone screen",
  in_person: "In-person interview",
  demo: "Demo lesson",
  panel: "Panel interview",
};

export function roleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}

export function roleFromPosition(position: string | null | undefined): StaffRole {
  const p = (position ?? "").toLowerCase();
  if (p.includes("teach") || p.includes("educator") || p.includes("assistant")) return "teacher";
  if (p.includes("therap") || p.includes("speech") || p.includes("occupational")) return "therapist";
  if (p.includes("account") || p.includes("finance")) return "accountant";
  if (p.includes("admin") || p.includes("front desk") || p.includes("reception")) return "admin";
  if (p.includes("principal") || p.includes("director") || p.includes("manager")) return "executive";
  return "support";
}

type ParsedNotes = {
  position: string;
  qualification?: string;
  experienceYears: number;
  tag?: StaffInquiryTag;
  description: string;
};

function parseNotes(card: ApiKanbanCard): ParsedNotes {
  const position = (card.gradeOrProgram ?? "").replace(/^position:\s*/i, "").trim();
  const rest: string[] = [];
  let qualification: string | undefined;
  let experienceYears = 0;
  let tag: StaffInquiryTag | undefined;

  for (const part of (card.notes ?? "").split("|").map((p) => p.trim()).filter(Boolean)) {
    // "Waitlist for: …" is appended by the waitlist step — the column already says it.
    if (/^waitlist for:/i.test(part)) continue;
    const [, key, value = ""] = part.match(/^(qualification|experience|source):\s*(.*)$/i) ?? [];
    switch (key?.toLowerCase()) {
      case "qualification":
        qualification = value || undefined;
        break;
      case "experience":
        experienceYears = Number(value.match(/\d+(\.\d+)?/)?.[0] ?? 0);
        break;
      case "source": {
        const t = value.toLowerCase().replace(/[\s-]+/g, "_");
        if (t in TAG_LABELS) tag = t as StaffInquiryTag;
        break;
      }
      default:
        rest.push(part);
    }
  }
  return { position, qualification, experienceYears, tag, description: rest.join(" · ") };
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export type ApiStaffInquiryCard = StaffInquiryCard & {
  /** Position text exactly as the candidate wrote it */
  position: string;
  qualification?: string;
  /** Backend stage — offer / hire progress stored locally is only trusted while it is unchanged */
  apiStage: ApiPipelineStage;
};

/** Returns null for student inquiries and for closed / rejected candidates. */
export function toStaffInquiryCard(card: ApiKanbanCard): ApiStaffInquiryCard | null {
  if (!isStaffApplication(card)) return null;
  const stage = STAGE_FROM_API[card.stage];
  if (!stage) return null;
  const notes = parseNotes(card);
  const createdAt = card.createdAt ?? "";
  const meetingTime = card.meetingDate?.slice(11, 16);
  return {
    id: String(card.id),
    name: card.parentName?.trim() || "Unnamed candidate",
    email: card.parentEmail ?? "",
    phone: card.parentPhone ?? "",
    role: roleFromPosition(notes.position),
    position: notes.position,
    qualification: notes.qualification,
    branchId: card.branchId ?? "",
    stage,
    apiStage: card.stage,
    daysInStage: card.daysInCurrentStage ?? daysSince(card.stageUpdatedAt ?? card.updatedAt),
    tag: card.priorityBadge?.toUpperCase().includes("HOT") ? "hot_lead" : notes.tag ?? "online",
    description: notes.description || `Applied for ${notes.position || "a staff role"}.`,
    experienceYears: notes.experienceYears,
    inquiryTime: createdAt.slice(11, 16),
    createdAt: createdAt.slice(0, 10),
    interviewKind: card.meetingType === "ASSESSMENT" ? "demo" : card.meetingType ? "in_person" : undefined,
    interviewDate: card.meetingDate?.slice(0, 10),
    interviewTime: meetingTime || undefined,
    interviewLocation: card.meetingLocation ?? undefined,
  };
}

export function kanbanToStaffCards(board: ApiKanbanBoard): ApiStaffInquiryCard[] {
  const seen = new Set<number>();
  const cards: ApiStaffInquiryCard[] = [];
  for (const column of [
    board.newInquiryColumn,
    board.tourScheduledColumn,
    board.hoFeeLockColumn,
    board.enrolUnpaidColumn,
    board.enrolledColumn,
    board.waitlistColumn,
  ]) {
    for (const item of column ?? []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const card = toStaffInquiryCard(item);
      if (card) cards.push(card);
    }
  }
  return cards;
}

/** Body for `POST /public/forms/employment-application` (public form and HR's manual add). */
export function employmentApplicationBody(values: {
  name: string;
  email: string;
  phone: string;
  position: string;
  branchId?: string;
  experienceYears?: number;
  qualification?: string;
  tag?: StaffInquiryTag;
  notes?: string;
}) {
  // The backend joins note fields with " | " — keep pipes out of free text so they parse back.
  const extra = [
    values.tag && `Source: ${TAG_LABELS[values.tag]}`,
    values.notes?.replace(/\|/g, "/").trim(),
  ]
    .filter(Boolean)
    .join(" | ");
  return {
    companyId: COMPANY_ID,
    branchId: values.branchId || undefined,
    applicantName: values.name,
    email: values.email,
    phone: values.phone,
    positionApplied: values.position,
    highestQualification: values.qualification?.trim() || undefined,
    yearsOfExperience:
      values.experienceYears !== undefined ? String(values.experienceYears) : undefined,
    resumeUrlOrNotes: extra || undefined,
  };
}

const EDUCATION_RANK: { level: EducationRow["level"]; label: string }[] = [
  { level: "masters", label: "Masters" },
  { level: "bachelors", label: "Bachelors" },
  { level: "diploma", label: "Diploma" },
  { level: "hsc", label: "HSC / Intermediate" },
  { level: "ssc", label: "SSC / Matric" },
];

/** Highest completed education and total years from "2019 - 2023" style work rows. */
export function summarizeJobApplication(app: JobApplicationForm): {
  qualification?: string;
  experienceYears?: number;
} {
  const filled = app.education.filter((e) => e.institute.trim());
  const top = EDUCATION_RANK.find((r) => filled.some((e) => e.level === r.level));
  const row = top && filled.find((e) => e.level === top.level);
  const qualification = top
    ? [top.label, row?.subject.trim()].filter(Boolean).join(" — ")
    : undefined;

  const thisYear = new Date().getFullYear();
  let years = 0;
  let any = false;
  for (const w of app.workExperience) {
    if (!w.company.trim()) continue;
    any = true;
    const found = (w.joiningLeaving.match(/(19|20)\d{2}/g) ?? []).map(Number);
    if (found.length) {
      const ongoing = found.length === 1 || /present|current|till|now/i.test(w.joiningLeaving);
      const end = ongoing ? thisYear : found[found.length - 1];
      years += Math.max(0, end - found[0]);
    }
  }
  return { qualification, experienceYears: any ? years : undefined };
}

/** Body for `POST /admissions/inquiries/{id}/schedule-tour`, used as the interview step. */
export function interviewBody(values: {
  interviewKind: StaffInterviewKind;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  interviewNotes: string;
}) {
  const meetingType: ApiMeetingType =
    values.interviewKind === "demo" ? "ASSESSMENT" : "PARENT_INTERVIEW";
  return {
    meetingType,
    scheduledDate: values.interviewDate,
    scheduledTime:
      values.interviewTime.length === 5 ? `${values.interviewTime}:00` : values.interviewTime,
    locationOrClassroom: values.interviewLocation,
    notes: [INTERVIEW_LABELS[values.interviewKind], values.interviewNotes.trim()]
      .filter(Boolean)
      .join(" — "),
  };
}
