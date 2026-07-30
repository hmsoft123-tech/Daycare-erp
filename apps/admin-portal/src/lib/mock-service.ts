import { admissions } from "@/data/admissions";
import { branches } from "@/data/branches";
import { invoices, revenueData, branchRevenue } from "@/data/billing";
import { students, parents, classes } from "@/data/students";
import { staff, trainingVideos } from "@/data/staff";
import { staffInquiries } from "@/data/staff-inquiries";
import { purchaseRequisitions, inventoryItems, stockLevels } from "@/data/inventory";
import { todayAttendance, generateAttendanceHistory } from "@/data/attendance";
import {
  inactiveStudentMessage,
  isBillableStudent,
  isPayableStaff,
} from "@/lib/eligibility";
import { activeExtras } from "@/lib/student-extras";
import type {
  AdmissionCard,
  AdmissionStage,
  Branch,
  BranchScorecard,
  EnrollmentFeedItem,
  InventoryItem,
  Invoice,
  LineItem,
  MedicalIncident,
  PRStatus,
  PurchaseRequisition,
  RevenueDataPoint,
  EmployeeFileEntry,
  Staff,
  StaffInquiryCard,
  StockLevel,
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
  if (filters?.status) {
    result = result.filter((s) => s.status === filters.status);
  } else {
    // All Students — exclude pipeline waitlist (managed under Admissions)
    result = result.filter((s) => s.status !== "waitlist");
  }
  if (filters?.branchId) result = result.filter((s) => s.branchId === filters.branchId);
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

/**
 * Create invoice — blocked for inactive / alumni / waitlist / inquiry students.
 * Active student extras (benefits / add-ons / charges) are merged into line items.
 * TODO: Replace with API POST /api/invoices
 */
export async function createInvoice(input: {
  studentId: string;
  planType: string;
  /** Tuition amount before extras */
  amount: number;
  admissionFee?: number;
  dueDate: string;
  currency?: "PKR";
  includeExtras?: boolean;
}): Promise<{ ok: true; invoice: Invoice } | { ok: false; error: string }> {
  const student = students.find((s) => s.id === input.studentId);
  if (!student) {
    return { ok: false, error: "Student not found." };
  }
  if (!isBillableStudent(student)) {
    return { ok: false, error: inactiveStudentMessage(student.status) };
  }

  const extras = input.includeExtras === false ? [] : activeExtras(student.extras);
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);
  const admissionFee = input.admissionFee ?? 0;
  const netAmount = Math.max(0, input.amount + admissionFee + extrasTotal);

  const lineItems: LineItem[] = [
    { id: `li-tuition-${Date.now()}`, description: input.planType, amount: input.amount },
  ];
  if (admissionFee > 0) {
    lineItems.push({
      id: `li-adm-${Date.now()}`,
      description: "Admission fee",
      amount: admissionFee,
    });
  }
  extras.forEach((e, i) => {
    lineItems.push({
      id: `li-ex-${e.id}-${i}`,
      description: `${e.label} (${e.kind})`,
      amount: e.amount,
    });
  });

  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    studentId: student.id,
    branchId: student.branchId,
    planType: input.planType,
    amount: netAmount,
    currency: input.currency ?? "PKR",
    dueDate: input.dueDate,
    status: "pending",
    lineItems,
  };
  invoices.unshift(invoice);
  return { ok: true, invoice };
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

/** Active staff only — use for payroll and new HR financial entries */
export async function getPayableStaff(branchId?: string): Promise<Staff[]> {
  const list = await getStaff(branchId);
  return list.filter(isPayableStaff);
}

// TODO: Replace with API call to /api/staff/inquiries
export async function getStaffInquiries(branchId?: string): Promise<StaffInquiryCard[]> {
  if (!branchId) return staffInquiries;
  return staffInquiries.filter((s) => s.branchId === branchId);
}

// TODO: Replace with API call to /api/staff/inquiries/:id
export async function getStaffInquiryById(id: string): Promise<StaffInquiryCard | undefined> {
  return staffInquiries.find((s) => s.id === id);
}

// TODO: Replace with API call to /api/staff/:id
export async function getStaffById(id: string): Promise<Staff | undefined> {
  return staff.find((s) => s.id === id);
}

export async function updateStaffEmployeeFile(
  id: string,
  employeeFile: EmployeeFileEntry[]
): Promise<Staff | undefined> {
  const idx = staff.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  staff[idx] = { ...staff[idx], employeeFile };
  return staff[idx];
}

export async function markStaffProbationComplete(id: string): Promise<Staff | undefined> {
  const idx = staff.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  staff[idx] = {
    ...staff[idx],
    probationCompleted: true,
    probationEndDate:
      staff[idx].probationEndDate ?? new Date().toISOString().slice(0, 10),
  };
  return staff[idx];
}

export async function updateStaffRecord(
  id: string,
  patch: Partial<Staff>
): Promise<Staff | undefined> {
  const idx = staff.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  staff[idx] = { ...staff[idx], ...patch, id };
  return staff[idx];
}

// TODO: Replace with API call to /api/inventory/requisitions
export async function getPurchaseRequisitions(branchId?: string): Promise<PurchaseRequisition[]> {
  if (!branchId) return purchaseRequisitions;
  return purchaseRequisitions.filter((p) => p.branchId === branchId);
}

// TODO: Replace with API call to /api/inventory/items
export async function getInventoryItems(activeOnly = false): Promise<InventoryItem[]> {
  if (!activeOnly) return inventoryItems;
  return inventoryItems.filter((i) => i.active);
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
  return inventoryItems.find((i) => i.id === id);
}

export async function createInventoryItem(
  input: Omit<InventoryItem, "id">
): Promise<InventoryItem> {
  const item: InventoryItem = { ...input, id: `inv-${Date.now()}` };
  inventoryItems.unshift(item);
  return item;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryItem>
): Promise<InventoryItem | undefined> {
  const idx = inventoryItems.findIndex((i) => i.id === id);
  if (idx < 0) return undefined;
  inventoryItems[idx] = { ...inventoryItems[idx], ...patch, id };
  return inventoryItems[idx];
}

// TODO: Replace with API call to /api/inventory/stock
export async function getStockLevels(branchId?: string): Promise<StockLevel[]> {
  if (!branchId) return stockLevels;
  return stockLevels.filter((s) => s.branchId === branchId);
}

export async function adjustStock(input: {
  itemId: string;
  branchId: string;
  delta: number;
}): Promise<StockLevel> {
  const existing = stockLevels.find(
    (s) => s.itemId === input.itemId && s.branchId === input.branchId
  );
  const today = new Date().toISOString().slice(0, 10);
  if (existing) {
    existing.qtyOnHand = Math.max(0, existing.qtyOnHand + input.delta);
    existing.updatedAt = today;
    return existing;
  }
  const created: StockLevel = {
    id: `stk-${Date.now()}`,
    itemId: input.itemId,
    branchId: input.branchId,
    qtyOnHand: Math.max(0, input.delta),
    updatedAt: today,
  };
  stockLevels.unshift(created);
  return created;
}

export async function createPurchaseRequisition(
  input: Omit<PurchaseRequisition, "id" | "totalAmount" | "status" | "date"> & {
    date?: string;
    status?: PRStatus;
  }
): Promise<PurchaseRequisition> {
  const totalAmount = input.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const pr: PurchaseRequisition = {
    id: `pr-${Date.now()}`,
    branchId: input.branchId,
    requestedBy: input.requestedBy,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    items: input.items,
    totalAmount,
    status: input.status ?? "pending",
    vendor: input.vendor,
    summary: input.summary,
  };
  purchaseRequisitions.unshift(pr);
  return pr;
}

export async function updatePurchaseRequisitionStatus(
  id: string,
  status: PRStatus
): Promise<PurchaseRequisition | undefined> {
  const pr = purchaseRequisitions.find((p) => p.id === id);
  if (!pr) return undefined;
  if (pr.status === status) return pr;
  const wasPending = pr.status === "pending";
  pr.status = status;
  // Receive stock only when approving a pending PR (avoid double-receive)
  if (status === "approved" && wasPending) {
    for (const line of pr.items) {
      if (!line.itemId) continue;
      await adjustStock({ itemId: line.itemId, branchId: pr.branchId, delta: line.qty });
    }
  }
  return pr;
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
    ? admissions.filter((a) => a.branchId === branchId && a.stage !== "paid")
    : admissions.filter((a) => a.stage !== "paid");

  return {
    totalStudents: branchId ? filteredStudents.length : 847,
    monthlyRevenue: branchId
      ? filteredInvoices.reduce((sum, i) => sum + i.amount, 0)
      : 2400000,
    pendingAdmissions: branchId ? pendingAdmissions.length : 23,
    attendanceRate: 94,
  };
}
