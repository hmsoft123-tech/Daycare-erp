import type { StudentExtra } from "@/types";

/** Preset extras aligned with SDLC services / fee schedule */
export const STUDENT_EXTRA_PRESETS: Omit<StudentExtra, "id" | "active">[] = [
  { label: "Saturday Care", amount: 600, kind: "addon", notes: "Per Saturday · Rs. 600" },
  { label: "Meal Program", amount: 4500, kind: "addon", notes: "Monthly meal package" },
  { label: "Quran / Religious Studies", amount: 3000, kind: "addon" },
  { label: "Extra Daycare Hours Pack", amount: 5000, kind: "charge", notes: "Beyond allotted shift · Rs. 500 / half hour billed as pack" },
  { label: "Sibling Benefit Discount", amount: -2000, kind: "benefit", notes: "Credit applied on invoice" },
  { label: "Staff Child Benefit", amount: -5000, kind: "benefit", notes: "Staff discount credit" },
  { label: "Scholarship Benefit", amount: -3000, kind: "benefit" },
  { label: "CCTV Footage Access", amount: 500, kind: "charge", notes: "Recorded footage request · Rs. 500" },
];

export function activeExtrasTotal(extras?: StudentExtra[]): number {
  if (!extras?.length) return 0;
  return extras.filter((e) => e.active).reduce((sum, e) => sum + e.amount, 0);
}

export function activeExtras(extras?: StudentExtra[]): StudentExtra[] {
  return (extras ?? []).filter((e) => e.active);
}
