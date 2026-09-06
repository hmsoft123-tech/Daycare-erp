import type { FeeLockRequest } from "@/types";

/**
 * HO fee / discount approval queue.
 * Standard programmed fee plans do not need HO.
 * Discounts, waivers, and special rates require Head Office only.
 * Unpaid-first-payment locks also route here when branch requests HO confirmation.
 */
export const feeLockRequests: FeeLockRequest[] = [
  {
    id: "fl1",
    branchId: "branch-clifton",
    source: "admission",
    status: "pending_ho",
    studentName: "Zara Mahmood",
    admissionId: "a6",
    monthlyTuition: 80000,
    admissionFee: 5000,
    discountType: "sibling",
    discountValue: 10,
    feeNotes: "Sibling discount 10% — HO approval required (standard plan otherwise pre-programmed)",
    feePlan: "Preschool — Plus",
    requestedBy: "Branch Admin · Clifton",
    requestedAt: "2026-07-28T09:15:00.000Z",
  },
  {
    id: "fl2",
    branchId: "branch-dha",
    source: "student",
    status: "pending_ho",
    studentName: "Ayaan Malik",
    studentId: "s3",
    priorStudentStatus: "active",
    monthlyTuition: 85000,
    admissionFee: 0,
    discountType: "scholarship",
    discountValue: 15,
    feePlan: "Full Day Monthly",
    feeNotes: "Scholarship discount 15% — outside standard fee structure; HO only",
    requestedBy: "Branch Admin · DHA",
    requestedAt: "2026-07-28T11:40:00.000Z",
  },
  {
    id: "fl3",
    branchId: "branch-nn",
    source: "admission",
    status: "pending_ho",
    studentName: "Noor Fatima",
    monthlyTuition: 65000,
    admissionFee: 5000,
    discountType: "staff",
    discountValue: 20,
    feePlan: "Playgroup — Lite",
    feeNotes: "Staff child discount 20% — Head Office approval",
    requestedBy: "Branch Admin · NN",
    requestedAt: "2026-08-01T08:20:00.000Z",
  },
];
