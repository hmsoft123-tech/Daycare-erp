import { admissions } from "@/data/admissions";
import { branches } from "@/data/branches";
import { invoices, revenueData, branchRevenue } from "@/data/billing";
import { students, parents, classes } from "@/data/students";
import { staff, trainingVideos } from "@/data/staff";
import { purchaseRequisitions } from "@/data/inventory";
import { todayAttendance, generateAttendanceHistory } from "@/data/attendance";
import type {
  AdmissionCard,
  AdmissionStage,
  Branch,
  BranchScorecard,
  EnrollmentFeedItem,
  Invoice,
  MedicalIncident,
  PurchaseRequisition,
  RevenueDataPoint,
  Staff,
  Student,
  StudentFilters,
  StudentNote,
  TherapySession,
  TrainingVideo,
  AttendanceRecord,
} from "@/types";

// TODO: Replace with API call to /api/branches
export async function getBranches(): Promise<Branch[]> {
  return branches;
}

// TODO: Replace with API call to /api/students
export async function getStudents(filters?: StudentFilters): Promise<Student[]> {
  let result = [...students];
  if (filters?.branchId) result = result.filter((s) => s.branchId === filters.branchId);
  if (filters?.status) result = result.filter((s) => s.status === filters.status);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }
  return result;
}

// TODO: Replace with API call to /api/students/:id
export async function getStudentById(id: string): Promise<Student | undefined> {
  return students.find((s) => s.id === id);
}

// TODO: Replace with API call to /api/parents
export async function getParentsByIds(ids: string[]) {
  return parents.filter((p) => ids.includes(p.id));
}

// TODO: Replace with API call to /api/invoices
export async function getInvoices(branchId?: string): Promise<Invoice[]> {
  if (!branchId) return invoices;
  return invoices.filter((i) => i.branchId === branchId);
}

// TODO: Replace with API call to /api/invoices/:id
export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  return invoices.find((i) => i.id === id);
}

// TODO: Replace with API call to /api/admissions
export async function getAdmissions(branchId?: string, stage?: AdmissionStage): Promise<AdmissionCard[]> {
  let result = [...admissions];
  if (branchId) result = result.filter((a) => a.branchId === branchId);
  if (stage) result = result.filter((a) => a.stage === stage);
  return result;
}

// TODO: Replace with API call to /api/staff
export async function getStaff(branchId?: string): Promise<Staff[]> {
  if (!branchId) return staff;
  return staff.filter((s) => s.branchId === branchId);
}

// TODO: Replace with API call to /api/staff/:id
export async function getStaffById(id: string): Promise<Staff | undefined> {
  return staff.find((s) => s.id === id);
}

// TODO: Replace with API call to /api/inventory/requisitions
export async function getPurchaseRequisitions(branchId?: string): Promise<PurchaseRequisition[]> {
  if (!branchId) return purchaseRequisitions;
  return purchaseRequisitions.filter((p) => p.branchId === branchId);
}

// TODO: Replace with API call to /api/attendance
export async function getTodayAttendance(classId: string): Promise<AttendanceRecord[]> {
  return todayAttendance.filter((a) => a.classId === classId);
}

// TODO: Replace with API call to /api/attendance/:studentId
export async function getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  return generateAttendanceHistory(studentId);
}

// TODO: Replace with API call to /api/admissions/:id
export async function getAdmissionById(id: string): Promise<AdmissionCard | undefined> {
  return admissions.find((a) => a.id === id);
}

// TODO: Replace with API call to /api/inventory/requisitions/:id
export async function getPurchaseRequisitionById(id: string): Promise<PurchaseRequisition | undefined> {
  return purchaseRequisitions.find((p) => p.id === id);
}

// TODO: Replace with API call to /api/dashboard/revenue
export async function getRevenueData(): Promise<RevenueDataPoint[]> {
  return revenueData;
}

// TODO: Replace with API call to /api/dashboard/enrollments
export async function getRecentEnrollments(): Promise<EnrollmentFeedItem[]> {
  return [
    { id: "e1", studentName: "Hamdan Khan", branchId: "branch-nn", enrolledDate: "2025-06-20", status: "active", avatar: "https://i.pravatar.cc/150?img=1" },
    { id: "e2", studentName: "Zainab Siddiqui", branchId: "branch-clifton", enrolledDate: "2025-06-18", status: "active", avatar: "https://i.pravatar.cc/150?img=5" },
    { id: "e3", studentName: "Yusuf Ahmed", branchId: "branch-dha", enrolledDate: "2025-06-15", status: "inquiry", avatar: "https://i.pravatar.cc/150?img=52" },
    { id: "e4", studentName: "Mariam Noor", branchId: "branch-gulshan", enrolledDate: "2025-06-12", status: "waitlist", avatar: "https://i.pravatar.cc/150?img=53" },
    { id: "e5", studentName: "Arham Saleem", branchId: "branch-nn", enrolledDate: "2025-06-10", status: "active", avatar: "https://i.pravatar.cc/150?img=54" },
    { id: "e6", studentName: "Hania Rizvi", branchId: "branch-clifton", enrolledDate: "2025-06-08", status: "active", avatar: "https://i.pravatar.cc/150?img=55" },
    { id: "e7", studentName: "Rayyan Iqbal", branchId: "branch-dha", enrolledDate: "2025-06-05", status: "inquiry", avatar: "https://i.pravatar.cc/150?img=56" },
    { id: "e8", studentName: "Zara Mahmood", branchId: "branch-gulshan", enrolledDate: "2025-06-03", status: "active", avatar: "https://i.pravatar.cc/150?img=57" },
    { id: "e9", studentName: "Ahmed Raza", branchId: "branch-nn", enrolledDate: "2025-06-01", status: "waitlist", avatar: "https://i.pravatar.cc/150?img=58" },
    { id: "e10", studentName: "Laiba Khan", branchId: "branch-clifton", enrolledDate: "2025-05-28", status: "active", avatar: "https://i.pravatar.cc/150?img=59" },
  ];
}

// TODO: Replace with API call to /api/training
export async function getTrainingVideos(): Promise<TrainingVideo[]> {
  return trainingVideos;
}

// TODO: Replace with API call to /api/therapy/sessions
export async function getTherapySessions(studentId?: string): Promise<TherapySession[]> {
  const sessions: TherapySession[] = [
    {
      id: "ts1",
      studentId: "s1",
      date: "2025-06-20",
      therapistName: "Sana Javed",
      duration: 45,
      types: ["Speech", "ABA"],
      subjective: "Hamdan was cooperative today.",
      objective: "Completed articulation exercises.",
      assessment: "Good progress on /s/ sounds.",
      plan: "Continue current protocol.",
      complianceScore: 8,
      goalsAchieved: ["Articulation practice", "Turn-taking"],
    },
    {
      id: "ts2",
      studentId: "s1",
      date: "2025-06-13",
      therapistName: "Usman Ali",
      duration: 60,
      types: ["Occupational"],
      subjective: "Some resistance to fine motor tasks.",
      objective: "Completed peg board activity.",
      assessment: "Improving grip strength.",
      plan: "Increase difficulty next session.",
      complianceScore: 6,
      goalsAchieved: ["Fine motor practice"],
    },
  ];
  if (studentId) return sessions.filter((s) => s.studentId === studentId);
  return sessions;
}

// TODO: Replace with API call to /api/reports/scorecards
export async function getBranchScorecards(): Promise<BranchScorecard[]> {
  return [
    { branchId: "branch-nn", academic: 92, hygiene: 95, finance: 88, overallGrade: "A" },
    { branchId: "branch-clifton", academic: 89, hygiene: 91, finance: 90, overallGrade: "A" },
    { branchId: "branch-dha", academic: 78, hygiene: 72, finance: 75, overallGrade: "C" },
    { branchId: "branch-gulshan", academic: 91, hygiene: 93, finance: 92, overallGrade: "A" },
  ];
}

// TODO: Replace with API call to /api/reports/branch-revenue
export async function getBranchRevenueData() {
  return branchRevenue;
}

// TODO: Replace with API call to /api/students/:id/notes
export async function getStudentNotes(studentId: string): Promise<StudentNote[]> {
  return [
    { id: "n1", studentId, author: "Nadia Farooq", content: "Hamdan showed excellent progress in group activities today.", createdAt: "2025-06-24" },
    { id: "n2", studentId, author: "Sana Javed", content: "Therapy session went well. Continue peanut-free snacks.", createdAt: "2025-06-20" },
    { id: "n3", studentId, author: "Dr. Sofia Rahman", content: "Parent meeting scheduled for next week.", createdAt: "2025-06-15" },
  ];
}

// TODO: Replace with API call to /api/students/:id/medical
export async function getMedicalIncidents(studentId: string): Promise<MedicalIncident[]> {
  return [
    { id: "m1", studentId, date: "2025-05-10", description: "Minor scratch during outdoor play", severity: "low" },
    { id: "m2", studentId, date: "2025-04-22", description: "Allergic reaction avoided — snack checked", severity: "medium" },
  ];
}

export async function getClasses(branchId?: string) {
  if (!branchId) return classes;
  return classes.filter((c) => c.branchId === branchId);
}

export async function getDashboardKPIs(branchId?: string) {
  const filteredStudents = branchId
    ? students.filter((s) => s.branchId === branchId && s.status === "active")
    : students.filter((s) => s.status === "active");
  const filteredInvoices = branchId
    ? invoices.filter((i) => i.branchId === branchId)
    : invoices;
  const pendingAdmissions = branchId
    ? admissions.filter((a) => a.branchId === branchId && a.stage !== "enrolled" && a.stage !== "rejected")
    : admissions.filter((a) => a.stage !== "enrolled" && a.stage !== "rejected");

  return {
    totalStudents: branchId ? filteredStudents.length : 847,
    monthlyRevenue: branchId
      ? filteredInvoices.reduce((sum, i) => sum + i.amount, 0)
      : 2400000,
    pendingAdmissions: branchId ? pendingAdmissions.length : 23,
    attendanceRate: 94,
  };
}
