import type { FeeLockRequest } from "@/types";

/** In-memory HO fee-lock approval queue (branch → HO → pending payment) */
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
    feeNotes: "Sibling discount — lock fees until first payment",
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
    feePlan: "Full Day Monthly",
    feeNotes: "Request fee lock before marking pending payment",
    requestedBy: "Branch Admin · DHA",
    requestedAt: "2026-07-28T11:40:00.000Z",
  },
];
