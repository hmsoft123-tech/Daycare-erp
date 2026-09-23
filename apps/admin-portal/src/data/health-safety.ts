import type {
  HealthFrequency,
  HealthOutcome,
  HealthRecord,
  HealthRecordCategory,
  HealthSubject,
  VaccinationCampaign,
} from "@/types";
import { seedStamp } from "@/lib/audit";

export type HealthCategoryDef = {
  value: HealthRecordCategory;
  label: string;
  subjects: HealthSubject[];
  defaultFrequency: HealthFrequency;
};

export const HEALTH_CATEGORIES: HealthCategoryDef[] = [
  { value: "hygiene_check", label: "Monthly Hygiene Check", subjects: ["student", "staff"], defaultFrequency: "monthly" },
  { value: "health_check", label: "Health Check", subjects: ["student", "staff"], defaultFrequency: "bi_annual" },
  { value: "polio_vaccination", label: "Polio Vaccination", subjects: ["student"], defaultFrequency: "campaign" },
  { value: "vaccination", label: "Other Vaccination", subjects: ["student", "staff"], defaultFrequency: "one_time" },
  { value: "medical_info", label: "Medical Information", subjects: ["student"], defaultFrequency: "as_needed" },
  { value: "allergy", label: "Allergy Information", subjects: ["student"], defaultFrequency: "as_needed" },
  { value: "medication", label: "Medication / Treatment", subjects: ["student"], defaultFrequency: "as_needed" },
  { value: "health_incident", label: "Health Incident", subjects: ["student"], defaultFrequency: "as_needed" },
  { value: "medical_test", label: "Required Medical Test", subjects: ["staff"], defaultFrequency: "annual" },
  { value: "hepatitis_b", label: "Hepatitis B", subjects: ["staff"], defaultFrequency: "one_time" },
  { value: "hepatitis_c", label: "Hepatitis C", subjects: ["staff"], defaultFrequency: "annual" },
  { value: "fitness_certificate", label: "Medical Fitness Certificate", subjects: ["staff"], defaultFrequency: "annual" },
];

export const HEALTH_CATEGORY_LABEL = Object.fromEntries(
  HEALTH_CATEGORIES.map((c) => [c.value, c.label])
) as Record<HealthRecordCategory, string>;

export const HEALTH_FREQUENCY_LABEL: Record<HealthFrequency, string> = {
  monthly: "Monthly",
  bi_annual: "Bi-annual",
  annual: "Annual",
  campaign: "Vaccination campaign",
  one_time: "One-time",
  as_needed: "As needed",
};

export const HEALTH_OUTCOME_LABEL: Record<HealthOutcome, string> = {
  clear: "Clear",
  attention: "Needs attention",
  referred: "Referred",
  pending: "Pending",
  positive: "Positive",
  negative: "Negative",
  completed: "Completed",
};

export const healthRecords: HealthRecord[] = [
  // ── Students ──
  {
    id: "hr-1", subject: "student", personId: "s1", personName: "Hamdan Khan", branchId: "branch-nn",
    category: "hygiene_check", title: "September hygiene check", date: "2026-09-03", frequency: "monthly",
    outcome: "clear", details: "Nails trimmed, uniform clean, no lice.", conductedBy: "Fatima Noor",
    followUpRequired: false, nextDueDate: "2026-10-03", parentNotified: false,
    lastUpdated: seedStamp("2026-09-03 10:40", "Fatima Noor"),
  },
  {
    id: "hr-2", subject: "student", personId: "s2", personName: "Zainab Siddiqui", branchId: "branch-clifton",
    category: "hygiene_check", title: "September hygiene check", date: "2026-09-04", frequency: "monthly",
    outcome: "attention", details: "Long nails; lice check positive — parents informed.", conductedBy: "Nadia Farooq",
    followUpRequired: true, followUpDate: "2026-09-11", followUpDone: false, nextDueDate: "2026-10-04",
    parentNotified: true, parentNotifiedAt: "2026-09-04T12:05:00",
    lastUpdated: seedStamp("2026-09-04 12:05", "Nadia Farooq"),
  },
  {
    id: "hr-3", subject: "student", personId: "s1", personName: "Hamdan Khan", branchId: "branch-nn",
    category: "health_check", title: "Bi-annual health check (H1)", date: "2026-03-12", frequency: "bi_annual",
    outcome: "clear", specifics: "Height 92 cm · Weight 13.4 kg · Vision OK · Dental OK", conductedBy: "Dr. Aamir (panel doctor)",
    followUpRequired: false, nextDueDate: "2026-09-12", parentNotified: true, parentNotifiedAt: "2026-03-12T15:00:00",
    lastUpdated: seedStamp("2026-03-12 15:00", "Hina Tariq"),
  },
  {
    id: "hr-4", subject: "student", personId: "s3", personName: "Ayaan Malik", branchId: "branch-dha",
    category: "polio_vaccination", title: "NIDs polio drops — Sep 2026", date: "2026-09-15", frequency: "campaign",
    outcome: "completed", specifics: "OPV — 2 drops", conductedBy: "EPI Sindh team", campaignId: "vc-1",
    followUpRequired: false, parentNotified: true, parentNotifiedAt: "2026-09-15T13:30:00",
    lastUpdated: seedStamp("2026-09-15 13:30", "Farah Iqbal"),
  },
  {
    id: "hr-5", subject: "student", personId: "s1", personName: "Hamdan Khan", branchId: "branch-nn",
    category: "allergy", title: "Peanut allergy", date: "2024-01-10", frequency: "as_needed",
    outcome: "attention", details: "Severe — no peanut products. EpiPen in office first-aid box.",
    specifics: "EpiPen Jr 0.15 mg", followUpRequired: false, parentNotified: true,
    lastUpdated: seedStamp("2026-08-01 09:10", "Hina Tariq"),
  },
  {
    id: "hr-6", subject: "student", personId: "s4", personName: "Sara Hussain", branchId: "branch-gulshan",
    category: "medication", title: "Antibiotic course", date: "2026-09-20", frequency: "as_needed",
    outcome: "pending", specifics: "Amoxicillin 5 ml at 12:00 PM for 5 days", details: "Parent-signed medication form on file.",
    followUpRequired: true, followUpDate: "2026-09-25", followUpDone: false, parentNotified: true,
    parentNotifiedAt: "2026-09-20T08:30:00",
    lastUpdated: seedStamp("2026-09-23 12:05", "Ayesha Malik"),
  },
  {
    id: "hr-7", subject: "student", personId: "s6", personName: "Fatima Raza", branchId: "branch-clifton",
    category: "health_incident", title: "Fever during class", date: "2026-09-22", frequency: "as_needed",
    outcome: "referred", details: "Temp 101°F at 10:30 AM. Cold compress, parent collected at 11:15 AM.",
    conductedBy: "Nadia Farooq", followUpRequired: true, followUpDate: "2026-09-24", followUpDone: false,
    parentNotified: true, parentNotifiedAt: "2026-09-22T10:35:00",
    lastUpdated: seedStamp("2026-09-22 11:20", "Nadia Farooq"),
  },
  {
    id: "hr-8", subject: "student", personId: "s5", personName: "Omar Ahmed", branchId: "branch-nn",
    category: "vaccination", title: "MMR 2nd dose record", date: "2026-07-02", frequency: "one_time",
    outcome: "completed", specifics: "MMR — dose 2 (EPI card copy received)", followUpRequired: false,
    parentNotified: false, lastUpdated: seedStamp("2026-07-05 09:00", "Hina Tariq"),
  },
  {
    id: "hr-9", subject: "student", personId: "s2", personName: "Zainab Siddiqui", branchId: "branch-clifton",
    category: "medical_info", title: "Asthma (mild)", date: "2025-08-20", frequency: "as_needed",
    outcome: "attention", details: "Inhaler (Ventolin) kept with class teacher. Avoid dusty play areas.",
    followUpRequired: false, parentNotified: true,
    lastUpdated: seedStamp("2026-08-15 14:25", "Nadia Farooq"),
  },
  // ── Staff ──
  {
    id: "hr-20", subject: "staff", personId: "st9", personName: "Fatima Noor", branchId: "branch-nn",
    category: "hygiene_check", title: "September staff hygiene check", date: "2026-09-02", frequency: "monthly",
    outcome: "clear", conductedBy: "Hina Tariq", followUpRequired: false, nextDueDate: "2026-10-02",
    lastUpdated: seedStamp("2026-09-02 09:15", "Hina Tariq"),
  },
  {
    id: "hr-21", subject: "staff", personId: "st2", personName: "Nadia Farooq", branchId: "branch-clifton",
    category: "health_check", title: "Periodic health check (H1)", date: "2026-02-18", frequency: "bi_annual",
    outcome: "clear", conductedBy: "Dr. Aamir (panel doctor)", followUpRequired: false, nextDueDate: "2026-08-18",
    lastUpdated: seedStamp("2026-02-18 16:00", "Admin"),
  },
  {
    id: "hr-22", subject: "staff", personId: "st3", personName: "Bilal Hashmi", branchId: "branch-dha",
    category: "hepatitis_b", title: "Hepatitis B vaccination", date: "2026-01-10", frequency: "one_time",
    outcome: "completed", specifics: "Engerix-B — dose 3 of 3", followUpRequired: false,
    nextDueDate: "2031-01-10", lastUpdated: seedStamp("2026-01-10 11:30", "Admin"),
  },
  {
    id: "hr-23", subject: "staff", personId: "st8", personName: "Amna Sheikh", branchId: "branch-clifton",
    category: "hepatitis_c", title: "Hepatitis C screening (Anti-HCV)", date: "2025-10-05", frequency: "annual",
    outcome: "negative", specifics: "Anti-HCV — non-reactive", followUpRequired: false, nextDueDate: "2026-10-05",
    lastUpdated: seedStamp("2025-10-06 10:00", "Admin"),
  },
  {
    id: "hr-24", subject: "staff", personId: "st10", personName: "Ayesha Malik", branchId: "branch-gulshan",
    category: "fitness_certificate", title: "Medical fitness certificate", date: "2025-09-28", frequency: "annual",
    outcome: "completed", details: "Fit for childcare duties.", conductedBy: "Liaquat National Hospital",
    followUpRequired: false, nextDueDate: "2026-09-28",
    lastUpdated: seedStamp("2025-09-29 12:40", "Admin"),
  },
  {
    id: "hr-25", subject: "staff", personId: "st7", personName: "Usman Ali", branchId: "branch-nn",
    category: "medical_test", title: "Annual CBC & TB screening", date: "2026-09-10", frequency: "annual",
    outcome: "pending", details: "Samples taken; report awaited.", followUpRequired: true, followUpDate: "2026-09-26",
    followUpDone: false, nextDueDate: "2027-09-10",
    lastUpdated: seedStamp("2026-09-10 15:45", "Hina Tariq"),
  },
  {
    id: "hr-26", subject: "staff", personId: "st4", personName: "Sana Javed", branchId: "branch-nn",
    category: "vaccination", title: "Typhoid conjugate vaccine", date: "2026-05-14", frequency: "one_time",
    outcome: "completed", specifics: "TCV — single dose", followUpRequired: false, nextDueDate: "2029-05-14",
    lastUpdated: seedStamp("2026-05-14 10:10", "Admin"),
  },
];

export const vaccinationCampaigns: VaccinationCampaign[] = [
  {
    id: "vc-1",
    name: "National Polio Campaign — September 2026",
    vaccine: "OPV (oral polio)",
    date: "2026-09-15",
    audience: "student",
    branchIds: ["branch-nn", "branch-dha", "branch-clifton"],
    conductedBy: "EPI Sindh team",
    notes: "Consent slips sent 12 Sep. Finger-marked children recorded.",
    coveredCount: 1,
    lastUpdated: seedStamp("2026-09-15 13:35", "Farah Iqbal"),
  },
  {
    id: "vc-2",
    name: "Staff Hepatitis B drive",
    vaccine: "Hepatitis B (Engerix-B)",
    date: "2026-01-10",
    audience: "staff",
    branchIds: ["branch-dha"],
    conductedBy: "Chughtai Lab outreach",
    coveredCount: 1,
    lastUpdated: seedStamp("2026-01-10 11:35", "Admin"),
  },
];
