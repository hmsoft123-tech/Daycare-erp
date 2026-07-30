import type {
  EmployeeFileEntry,
  EmployeeFileSlotKey,
  SalaryDetermination,
  SalaryLine,
  Staff,
  StaffRole,
  TrainingVideo,
} from "@/types";
import { EMPLOYEE_FILE_SLOTS } from "@/data/employee-file";
import { ROLE_BASE_SALARY, defaultShiftForRole } from "@/lib/salary-determination";

function seedFile(received: EmployeeFileSlotKey[]): EmployeeFileEntry[] {
  const set = new Set(received);
  return EMPLOYEE_FILE_SLOTS.map((s) => ({
    key: s.key,
    received: set.has(s.key),
    fileName: set.has(s.key) ? `${s.key}.pdf` : undefined,
    receivedAt: set.has(s.key) ? "2024-01-15" : undefined,
  }));
}

function line(
  id: string,
  label: string,
  amount: number,
  kind: SalaryLine["kind"],
  notes?: string
): SalaryLine {
  return { id, label, amount, kind, active: true, notes };
}

function seedSalary(
  role: StaffRole,
  opts: {
    educationLevel?: string;
    experienceYears?: number;
    yearsAtSdlc?: number;
    extras?: SalaryLine[];
  } = {}
): SalaryDetermination {
  return {
    baseSalary: ROLE_BASE_SALARY[role],
    shift: defaultShiftForRole(role),
    educationLevel: opts.educationLevel,
    experienceYears: opts.experienceYears ?? 0,
    yearsAtSdlc: opts.yearsAtSdlc ?? 0,
    lines: opts.extras ?? [],
    policyAcknowledgedAt: "2024-01-15",
  };
}

const hirePack: EmployeeFileSlotKey[] = [
  "cnic_self",
  "cnic_family",
  "last_degree",
  "last_pay_stub",
  "reference_letters",
  "job_application",
  "interview_evaluation",
  "signed_offer",
  "signed_job_description",
  "detailed_form",
  "staff_id_card",
  "induction_checklist",
  "signed_hr_policies",
];

export const staff: Staff[] = [
  {
    id: "st1",
    name: "Dr. Sofia Rahman",
    role: "executive",
    branchId: "branch-nn",
    employeeId: "KP-001",
    joinDate: "2007-03-01",
    phone: "+92 300 1112233",
    email: "sofia.rahman@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=47",
    specializations: ["Pediatrics"],
    status: "active",
    idCardNumber: "EMP-2007-0001",
    probationEndDate: "2007-06-01",
    probationCompleted: true,
    employeeFile: seedFile([...hirePack, "probation_evaluation", "annual_evaluation"]),
    salary: seedSalary("executive", {
      educationLevel: "MBBS / Pediatrics",
      experienceYears: 20,
      yearsAtSdlc: 19,
      extras: [
        line("s1a", "Years of service at SDLC", 15000, "adjustment"),
        line("s1b", "EOBI deduction", -2000, "deduction", "Registered EOBI"),
      ],
    }),
  },
  {
    id: "st2",
    name: "Nadia Farooq",
    role: "teacher",
    branchId: "branch-clifton",
    employeeId: "KP-042",
    joinDate: "2019-08-15",
    phone: "+92 321 4445566",
    email: "nadia.f@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=44",
    status: "active",
    probationEndDate: "2019-11-15",
    probationCompleted: true,
    employeeFile: seedFile([...hirePack, "probation_evaluation"]),
    salary: seedSalary("teacher", {
      educationLevel: "B.Ed",
      experienceYears: 8,
      yearsAtSdlc: 6,
      extras: [
        line("s2a", "Education bracket uplift", 5000, "adjustment"),
        line("s2b", "Past experience uplift", 4000, "adjustment"),
        line("s2c", "EOBI deduction", -1500, "deduction"),
      ],
    }),
  },
  {
    id: "st3",
    name: "Bilal Hashmi",
    role: "teacher",
    branchId: "branch-dha",
    employeeId: "KP-058",
    joinDate: "2020-01-10",
    phone: "+92 333 7778899",
    email: "bilal.h@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=13",
    status: "active",
    probationEndDate: "2020-04-10",
    probationCompleted: true,
    employeeFile: seedFile(hirePack),
    salary: seedSalary("teacher", {
      educationLevel: "BA Education",
      experienceYears: 5,
      yearsAtSdlc: 6,
      extras: [
        line("s3a", "Years of service at SDLC", 3000, "adjustment"),
        line("s3b", "Late arrival deduction", -3270, "deduction", "3 lates this month"),
      ],
    }),
  },
  {
    id: "st4",
    name: "Sana Javed",
    role: "therapist",
    branchId: "branch-nn",
    employeeId: "KP-071",
    joinDate: "2021-06-01",
    phone: "+92 345 2223344",
    email: "sana.j@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=32",
    specializations: ["Speech", "ABA"],
    status: "active",
    probationEndDate: "2021-09-01",
    probationCompleted: true,
    employeeFile: seedFile(hirePack),
    salary: seedSalary("therapist", {
      educationLevel: "MS Speech Therapy",
      experienceYears: 6,
      yearsAtSdlc: 5,
      extras: [
        line("s4a", "Education bracket uplift", 8000, "adjustment"),
        line("s4b", "Scheduled overtime / stay-back", 2500, "overtime"),
        line("s4c", "EOBI deduction", -1500, "deduction"),
      ],
    }),
  },
  {
    id: "st5",
    name: "Rashid Mehmood",
    role: "accountant",
    branchId: "branch-nn",
    employeeId: "KP-015",
    joinDate: "2015-04-20",
    phone: "+92 312 6667788",
    email: "rashid.m@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=15",
    status: "active",
    probationEndDate: "2015-07-20",
    probationCompleted: true,
    employeeFile: seedFile(hirePack),
    salary: seedSalary("accountant", {
      educationLevel: "ACCA / B.Com",
      experienceYears: 12,
      yearsAtSdlc: 11,
      extras: [
        line("s5a", "Years of service at SDLC", 5000, "adjustment"),
        line("s5b", "EOBI deduction", -1500, "deduction"),
      ],
    }),
  },
  {
    id: "st6",
    name: "Hina Tariq",
    role: "admin",
    branchId: "branch-gulshan",
    employeeId: "KP-033",
    joinDate: "2018-11-05",
    phone: "+92 322 8889900",
    email: "hina.t@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=25",
    status: "resigned",
    endDate: "2025-03-31",
    probationEndDate: "2019-02-05",
    probationCompleted: true,
    employeeFile: seedFile([...hirePack, "resignation_letter"]),
    salary: seedSalary("admin", {
      educationLevel: "MBA",
      experienceYears: 7,
      yearsAtSdlc: 6,
    }),
  },
  {
    id: "st7",
    name: "Usman Ali",
    role: "therapist",
    branchId: "branch-nn",
    employeeId: "KP-089",
    joinDate: "2022-02-14",
    phone: "+92 301 5556677",
    email: "usman.a@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=8",
    specializations: ["Occupational", "ABA"],
    status: "active",
    probationEndDate: "2022-05-14",
    probationCompleted: true,
    employeeFile: seedFile(hirePack),
    salary: seedSalary("therapist", {
      educationLevel: "BS OT",
      experienceYears: 4,
      yearsAtSdlc: 4,
      extras: [
        line("s7a", "Loan / advance installment", -5000, "deduction", "Month 2 of 5"),
        line("s7b", "EOBI deduction", -1500, "deduction"),
      ],
    }),
  },
  {
    id: "st8",
    name: "Amna Sheikh",
    role: "support",
    branchId: "branch-clifton",
    employeeId: "KP-102",
    joinDate: "2023-01-20",
    phone: "+92 334 1112233",
    email: "amna.s@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=38",
    status: "fired",
    endDate: "2025-05-15",
    probationEndDate: "2023-04-20",
    probationCompleted: true,
    employeeFile: seedFile([...hirePack, "termination_letter"]),
    salary: seedSalary("support", {
      experienceYears: 3,
      yearsAtSdlc: 2,
    }),
  },
  {
    id: "st9",
    name: "Fatima Noor",
    role: "teacher",
    branchId: "branch-nn",
    employeeId: "KP-118",
    joinDate: "2026-06-01",
    phone: "+92 300 9988776",
    email: "fatima.n@kinderpilot.pk",
    photo: "https://i.pravatar.cc/150?img=5",
    status: "active",
    idCardNumber: "EMP-2026-0118",
    probationEndDate: "2026-09-01",
    probationCompleted: false,
    employeeFile: seedFile([
      "cnic_self",
      "cnic_family",
      "last_degree",
      "job_application",
      "signed_offer",
      "signed_job_description",
      "staff_id_card",
      "signed_hr_policies",
    ]),
    salary: seedSalary("teacher", {
      educationLevel: "B.Ed",
      experienceYears: 2,
      yearsAtSdlc: 0,
      extras: [
        line("s9a", "Initial salary security hold", -3000, "deduction", "Gradual hold 3–5 months"),
        line("s9b", "Communication / skill adjustment", 2000, "adjustment"),
      ],
    }),
  },
];

export const trainingVideos: TrainingVideo[] = [
  { id: "v1", title: "Staff Induction 2024", duration: "45:00", category: "all", progress: 100, featured: true },
  { id: "v2", title: "Child Safety Protocols", duration: "22:30", category: "all", progress: 75 },
  { id: "v3", title: "Montessori Methods", duration: "38:15", category: "teachers", progress: 60 },
  { id: "v4", title: "ABA Therapy Basics", duration: "55:00", category: "therapists", progress: 40 },
  { id: "v5", title: "First Aid & Emergency", duration: "30:00", category: "all", progress: 90 },
  { id: "v6", title: "Speech Therapy Techniques", duration: "42:20", category: "therapists", progress: 25 },
  { id: "v7", title: "Parent Communication", duration: "18:45", category: "teachers", progress: 100 },
  { id: "v8", title: "Hygiene Standards", duration: "15:00", category: "all", progress: 50 },
];
