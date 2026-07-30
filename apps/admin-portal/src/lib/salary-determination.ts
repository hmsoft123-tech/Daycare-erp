import type { SalaryDetermination, SalaryLine, SalaryLineKind, Staff, StaffRole, StaffShiftKey } from "@/types";

export const STAFF_SHIFT_OPTIONS: {
  key: StaffShiftKey;
  label: string;
  timing: string;
}[] = [
  {
    key: "administration",
    label: "Administration",
    timing: "Mon–Fri 8:00AM – 3:00PM (Friday 2PM)",
  },
  {
    key: "class_teacher",
    label: "Class Teacher & Co-Teacher",
    timing: "Mon–Fri 8:00AM – 2:30PM (Friday 1:30PM)",
  },
  {
    key: "para_teacher_morning",
    label: "Para Teacher (morning)",
    timing: "10:00AM – 6:00PM (Saturday one hour less)",
  },
  {
    key: "para_teacher_evening",
    label: "Para Teacher (evening)",
    timing: "11:00AM – 7:00PM (Saturday one hour less)",
  },
  {
    key: "support_full_day",
    label: "Guard, Chef & Cleaning",
    timing: "7:00AM – 7:00PM (until last child)",
  },
];

/** Role default confidential brackets (mock ANNEX) */
export const ROLE_BASE_SALARY: Record<StaffRole, number> = {
  executive: 250000,
  therapist: 120000,
  teacher: 85000,
  admin: 75000,
  accountant: 70000,
  support: 45000,
};

export const defaultShiftForRole = (role: StaffRole): StaffShiftKey => {
  if (role === "admin" || role === "accountant" || role === "executive") return "administration";
  if (role === "support") return "support_full_day";
  if (role === "therapist") return "para_teacher_morning";
  return "class_teacher";
};

/** Presets aligned with SDLC Salary Determination & deductions policy */
export const SALARY_LINE_PRESETS: Omit<SalaryLine, "id" | "active">[] = [
  {
    label: "Education bracket uplift",
    amount: 5000,
    kind: "adjustment",
    notes: "Supported by degree documents on employee file",
  },
  {
    label: "Past experience uplift",
    amount: 4000,
    kind: "adjustment",
    notes: "Verified by references / last pay stub",
  },
  {
    label: "Years of service at SDLC",
    amount: 3000,
    kind: "adjustment",
    notes: "Same position may differ by tenure",
  },
  {
    label: "Communication / skill adjustment",
    amount: 2000,
    kind: "adjustment",
    notes: "Based on interview & demonstration",
  },
  {
    label: "Scheduled overtime / stay-back",
    amount: 2500,
    kind: "overtime",
    notes: "Hourly stay-back or holiday >5 hrs = 1 day pay",
  },
  {
    label: "EOBI deduction",
    amount: -1500,
    kind: "deduction",
    notes: "If registered for EOBI",
  },
  {
    label: "Late arrival deduction",
    amount: -Math.round(85000 / 26),
    kind: "deduction",
    notes: "3 lates (≥10 min) in a month → 1 day salary",
  },
  {
    label: "Unpaid / unauthorized leave",
    amount: -Math.round(85000 / 26),
    kind: "deduction",
    notes: "1 day salary per uninformed leave",
  },
  {
    label: "Loan / advance installment",
    amount: -5000,
    kind: "deduction",
    notes: "Interest-free · after probation · typically 5 months",
  },
  {
    label: "Initial salary security hold",
    amount: -3000,
    kind: "deduction",
    notes: "Gradual hold over 3–5 months · refunded on clearance",
  },
  {
    label: "Scheduled delayed arrival / early departure",
    amount: -Math.round(85000 / 26),
    kind: "deduction",
    notes: "2 occurrences may deduct 1 day (if no emergency)",
  },
];

export function activeSalaryLines(lines?: SalaryLine[]): SalaryLine[] {
  return (lines ?? []).filter((l) => l.active);
}

export function signedAmount(line: SalaryLine): number {
  if (line.kind === "deduction" && line.amount > 0) return -line.amount;
  return line.amount;
}

export function activeLinesTotal(lines?: SalaryLine[]): number {
  return activeSalaryLines(lines).reduce((sum, l) => sum + signedAmount(l), 0);
}

export function netMonthlyPay(salary?: SalaryDetermination): number {
  if (!salary) return 0;
  return Math.max(0, salary.baseSalary + activeLinesTotal(salary.lines));
}

export function allowancesTotal(lines?: SalaryLine[]): number {
  return activeSalaryLines(lines)
    .filter((l) => signedAmount(l) > 0)
    .reduce((sum, l) => sum + signedAmount(l), 0);
}

export function deductionsTotal(lines?: SalaryLine[]): number {
  return activeSalaryLines(lines)
    .filter((l) => signedAmount(l) < 0)
    .reduce((sum, l) => sum + Math.abs(signedAmount(l)), 0);
}

export function ensureSalary(member: Staff, offeredBase?: number): SalaryDetermination {
  if (member.salary) return member.salary;
  return {
    baseSalary: offeredBase ?? ROLE_BASE_SALARY[member.role] ?? 65000,
    shift: defaultShiftForRole(member.role),
    experienceYears: 0,
    yearsAtSdlc: 0,
    lines: [],
  };
}

export function buildPayrollBreakdown(member: Staff) {
  const salary = ensureSalary(member);
  const lines = activeSalaryLines(salary.lines).map((l) => ({
    id: l.id,
    label: l.label,
    kind: l.kind as SalaryLineKind,
    amount: signedAmount(l),
    notes: l.notes,
  }));
  const allowances = allowancesTotal(salary.lines);
  const deductions = deductionsTotal(salary.lines);
  const net = netMonthlyPay(salary);
  return {
    staffId: member.id,
    name: member.name,
    role: member.role,
    branchId: member.branchId,
    shift: salary.shift,
    baseSalary: salary.baseSalary,
    allowances,
    deductions,
    net,
    lines,
    educationLevel: salary.educationLevel,
    experienceYears: salary.experienceYears,
    yearsAtSdlc: salary.yearsAtSdlc,
  };
}

export const SALARY_POLICY_BLURB =
  "Salary is based on communication skills, experience, and education related to the job. " +
  "Each position has a confidential salary bracket (ANNEX). Salaries of employees in the same position may differ by education, past experience, and years served at SDLC. " +
  "Disbursement: 10th–15th of each month. Monthly pay is calculated after EOBI (if applicable), late arrivals, leaves, early departures, and loans.";
