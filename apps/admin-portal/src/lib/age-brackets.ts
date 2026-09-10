import type { ClassGroupId } from "@/data/services";

/** Approximate SDLC age brackets (years). Editable override remains in the wizard. */
const BRACKETS: { id: ClassGroupId; minYears: number; maxYears: number }[] = [
  { id: "infant", minYears: 0, maxYears: 1.2 },
  { id: "playgroup", minYears: 1.2, maxYears: 2.5 },
  { id: "pre_nursery", minYears: 2.5, maxYears: 3.5 },
  { id: "nursery", minYears: 3.5, maxYears: 4.5 },
  { id: "kindergarten", minYears: 4.5, maxYears: 6 },
  { id: "after_school", minYears: 5, maxYears: 12 },
];

export function ageYearsFromDob(dob: string, asOf = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let years = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) years -= 1;
  const fraction = (asOf.getMonth() - d.getMonth() + 12) % 12 / 12;
  return Math.max(0, years + fraction);
}

/** Recommend class/program from DOB; authorized users may override. */
export function recommendClassGroupFromDob(dob: string): ClassGroupId | null {
  const age = ageYearsFromDob(dob);
  if (age == null) return null;
  const match = BRACKETS.find((b) => age >= b.minYears && age < b.maxYears);
  if (match) return match.id;
  if (age >= 12) return "after_school";
  return "infant";
}
