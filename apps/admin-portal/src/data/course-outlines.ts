import type { CourseOutline, CourseVoucher } from "@/types";
import { seedStamp } from "@/lib/audit";

export const ACADEMIC_SESSIONS = ["2025–2026", "2026–2027", "2027–2028"] as const;

/** Class groups offered — keys match classrooms' `classGroup` */
export const COURSE_PROGRAMS: { classGroup: string; label: string }[] = [
  { classGroup: "infant", label: "Infant Room" },
  { classGroup: "playgroup", label: "Playgroup" },
  { classGroup: "pre_nursery", label: "Pre-Nursery" },
  { classGroup: "nursery", label: "Nursery" },
  { classGroup: "kindergarten", label: "Kindergarten" },
];

export const courseOutlines: CourseOutline[] = [
  {
    id: "crs-1",
    academicSession: "2026–2027",
    classGroup: "kindergarten",
    program: "Kindergarten",
    title: "Kindergarten Core Curriculum",
    outline:
      "Early literacy (phonics & sight words), numeracy to 50, Urdu qaida, general knowledge and creative arts. " +
      "Assessed termly through observation and portfolio work.",
    syllabus: [
      { id: "u1", period: "Term 1 (Aug – Oct)", subject: "English", topics: ["Letter sounds s-a-t-p-i-n", "Blending CVC words", "Rhymes"] },
      { id: "u2", period: "Term 1 (Aug – Oct)", subject: "Maths", topics: ["Counting 1–20", "Shapes", "Patterns"] },
      { id: "u3", period: "Term 2 (Nov – Jan)", subject: "English", topics: ["Digraphs sh/ch/th", "Sight words set 1"] },
      { id: "u4", period: "Term 2 (Nov – Jan)", subject: "Urdu", topics: ["Huroof-e-tahaji", "Jor tor"] },
      { id: "u5", period: "Term 3 (Feb – May)", subject: "Maths", topics: ["Numbers to 50", "Addition within 10", "Measurement"] },
    ],
    materials: [
      { id: "m1", itemId: "inv-19", name: "Phonics Book – Level A", kind: "book", qtyPerStudent: 1, unitPrice: 700, chargeToStudent: true },
      { id: "m2", itemId: "inv-20", name: "Early Maths Workbook", kind: "workbook", qtyPerStudent: 1, unitPrice: 650, chargeToStudent: true },
      { id: "m3", itemId: "inv-22", name: "Urdu Qaida", kind: "book", qtyPerStudent: 1, unitPrice: 350, chargeToStudent: true },
      { id: "m4", itemId: "inv-21", name: "Single-line Copy (80 pages)", kind: "copy", qtyPerStudent: 6, unitPrice: 90, chargeToStudent: true },
      { id: "m5", itemId: "inv-2", name: "Crayons", kind: "stationery", qtyPerStudent: 1, unitPrice: 250, chargeToStudent: false },
    ],
    courseFee: 4500,
    effectiveDate: "2026-08-01",
    status: "active",
    lastUpdated: seedStamp("2026-09-05 16:30", "Admin"),
  },
  {
    id: "crs-2",
    academicSession: "2026–2027",
    classGroup: "nursery",
    program: "Nursery",
    title: "Nursery Foundations",
    outline:
      "Pre-writing and fine-motor skills, letter recognition, counting to 20, circle-time language and sensory art.",
    syllabus: [
      { id: "u1", period: "Term 1 (Aug – Oct)", subject: "Language", topics: ["Pencil grip", "Tracing lines", "Letters a–h"] },
      { id: "u2", period: "Term 1 (Aug – Oct)", subject: "Numeracy", topics: ["Counting 1–10", "Big & small"] },
      { id: "u3", period: "Term 2 (Nov – Jan)", subject: "Creative", topics: ["Colour mixing", "Clay work"] },
    ],
    materials: [
      { id: "m1", itemId: "inv-14", name: "Preschool workbook pack", kind: "workbook", qtyPerStudent: 1, unitPrice: 1200, chargeToStudent: true },
      { id: "m2", itemId: "inv-23", name: "Nursery Art Kit", kind: "material", qtyPerStudent: 1, unitPrice: 1100, chargeToStudent: true },
      { id: "m3", itemId: "inv-22", name: "Urdu Qaida", kind: "book", qtyPerStudent: 1, unitPrice: 350, chargeToStudent: true },
      { id: "m4", itemId: "inv-21", name: "Single-line Copy (80 pages)", kind: "copy", qtyPerStudent: 3, unitPrice: 90, chargeToStudent: true },
    ],
    courseFee: 3500,
    effectiveDate: "2026-08-01",
    status: "active",
    lastUpdated: seedStamp("2026-09-06 11:10", "Ayesha Malik"),
  },
  {
    id: "crs-3",
    academicSession: "2026–2027",
    classGroup: "playgroup",
    program: "Playgroup",
    title: "Playgroup Play-based Learning",
    outline: "Sensory play, rhymes, colours and shapes, social skills and toilet-training routines.",
    syllabus: [
      { id: "u1", period: "Term 1 (Aug – Oct)", subject: "Sensory", topics: ["Textures", "Sounds around us"] },
      { id: "u2", period: "Term 2 (Nov – Jan)", subject: "Language", topics: ["Action rhymes", "Naming objects"] },
    ],
    materials: [
      { id: "m1", itemId: "inv-23", name: "Nursery Art Kit", kind: "material", qtyPerStudent: 1, unitPrice: 1100, chargeToStudent: true },
      { id: "m2", itemId: "inv-2", name: "Crayons", kind: "stationery", qtyPerStudent: 1, unitPrice: 250, chargeToStudent: true },
    ],
    courseFee: 2500,
    effectiveDate: "2026-08-01",
    status: "active",
    lastUpdated: seedStamp("2026-09-04 09:55", "Nadia Farooq"),
  },
  {
    id: "crs-4",
    academicSession: "2027–2028",
    classGroup: "kindergarten",
    program: "Kindergarten",
    title: "Kindergarten Core Curriculum (revised)",
    outline: "Draft revision adding Jolly Phonics Level B and STEM corner activities.",
    syllabus: [
      { id: "u1", period: "Term 1", subject: "English", topics: ["Jolly Phonics groups 1–3"] },
    ],
    materials: [
      { id: "m1", name: "Jolly Phonics Pupil Book 1", kind: "book", qtyPerStudent: 1, unitPrice: 1450, chargeToStudent: true },
    ],
    courseFee: 5000,
    effectiveDate: "2027-08-01",
    status: "draft",
    lastUpdated: seedStamp("2026-09-23 17:45", "Admin"),
  },
];

export const courseVouchers: CourseVoucher[] = [
  {
    id: "cv-1",
    voucherNumber: "CV-2026-0001",
    courseId: "crs-1",
    studentId: "s3",
    branchId: "branch-dha",
    lines: [
      { label: "Course fee — Kindergarten Core Curriculum", qty: 1, amount: 4500 },
      { label: "Phonics Book – Level A", qty: 1, amount: 700 },
      { label: "Early Maths Workbook", qty: 1, amount: 650 },
      { label: "Urdu Qaida", qty: 1, amount: 350 },
      { label: "Single-line Copy (80 pages)", qty: 6, amount: 540 },
    ],
    total: 6740,
    issuedAt: "2026-08-03",
    dueDate: "2026-08-13",
    status: "paid",
    materialsIssued: true,
    lastUpdated: seedStamp("2026-08-12 10:20", "Rashid Mehmood"),
  },
];
