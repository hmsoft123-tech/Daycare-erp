import { admissions } from "@/data/admissions";
import { branches } from "@/data/branches";
import { invoices, revenueData, branchRevenue } from "@/data/billing";
import { students, parents, classes } from "@/data/students";
import { classroomActivities } from "@/data/classroom-activities";
import { feeLockRequests } from "@/data/fee-lock-requests";
import { staff } from "@/data/staff";
import { trainingVideos } from "@/data/training-videos";
import { staffInquiries } from "@/data/staff-inquiries";
import { purchaseRequisitions, inventoryItems, stockLevels } from "@/data/inventory";
import { serviceOfferings } from "@/data/services";
import { todayAttendance, generateAttendanceHistory } from "@/data/attendance";
import {
  inactiveStudentMessage,
  isBillableStudent,
  isPayableStaff,
} from "@/lib/eligibility";
import { activeExtras } from "@/lib/student-extras";
import {
  LATE_FEE_AFTER_DUE,
  EXPIRY_SURCHARGE,
  billingMonthLabel,
  challanDueDate,
  challanValidityDate,
  todayIso,
  isChallanExpired,
  isPastDue,
} from "@/lib/fee-challan";
import { requisitionTotal } from "@/lib/procurement";
import type {
  AdmissionCard,
  AdmissionStage,
  Branch,
  BranchScorecard,
  DiscountType,
  EnrollmentFeedItem,
  FeeLockRequest,
  InventoryItem,
  Invoice,
  LineItem,
  MedicalIncident,
  PRStatus,
  PurchaseRequisition,
  RevenueDataPoint,
  EmployeeFileEntry,
  Staff,
  StaffStatus,
  StaffInquiryCard,
  ServiceOffering,
  StockLevel,
  Student,
  StudentFilters,
  StudentNote,
  StudentStatus,
  TherapySession,
  TrainingAudience,
  TrainingTopic,
  TrainingVideo,
  AttendanceRecord,
  ClassroomActivity,
  ClassRoom,
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

export async function updateStudentRecord(
  id: string,
  patch: Partial<Student>,
  opts?: { allowPendingPayment?: boolean }
): Promise<Student | undefined> {
  const idx = students.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  if (
    patch.status === "pending_first_payment" &&
    students[idx].status !== "pending_first_payment" &&
    !opts?.allowPendingPayment
  ) {
    return undefined;
  }
  students[idx] = { ...students[idx], ...patch, id };
  return students[idx];
}

export async function getFeeLockRequests(branchId?: string): Promise<FeeLockRequest[]> {
  const list = branchId
    ? feeLockRequests.filter((r) => r.branchId === branchId)
    : [...feeLockRequests];
  return list.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
}

/** Branch requests fee lock — student stays current status until HO approves */
export async function requestStudentFeeLock(input: {
  studentId: string;
  monthlyTuition?: number;
  admissionFee?: number;
  feeNotes?: string;
  requestedBy?: string;
}): Promise<{ ok: true; request: FeeLockRequest } | { ok: false; error: string }> {
  const student = students.find((s) => s.id === input.studentId);
  if (!student) return { ok: false, error: "Student not found." };
  if (student.status === "pending_first_payment") {
    return { ok: false, error: "Student is already pending payment." };
  }
  if (student.status === "inactive" || student.status === "alumni") {
    return { ok: false, error: "Cannot fee-lock an inactive or alumni student." };
  }
  const existing = feeLockRequests.find(
    (r) => r.studentId === student.id && r.status === "pending_ho"
  );
  if (existing) return { ok: false, error: "A fee-lock request is already pending HO approval." };

  const request: FeeLockRequest = {
    id: `fl-${Date.now()}`,
    branchId: student.branchId,
    source: "student",
    status: "pending_ho",
    studentName: `${student.firstName} ${student.lastName}`,
    studentId: student.id,
    priorStudentStatus: student.status,
    monthlyTuition: input.monthlyTuition ?? 80000,
    admissionFee: input.admissionFee ?? 0,
    feePlan: student.feePlan,
    feeNotes: input.feeNotes,
    requestedBy: input.requestedBy ?? "Branch Admin",
    requestedAt: new Date().toISOString(),
  };
  feeLockRequests.unshift(request);
  return { ok: true, request };
}

/** Branch submits admission fee package → pending HO (not yet enrol unpaid) */
export async function requestAdmissionFeeLock(input: {
  admissionId: string;
  monthlyTuition: number;
  admissionFee: number;
  discountType?: DiscountType;
  discountValue?: number;
  feeNotes?: string;
  feePlan?: string;
  requestedBy?: string;
}): Promise<{ ok: true; request: FeeLockRequest; admission: AdmissionCard } | { ok: false; error: string }> {
  const idx = admissions.findIndex((a) => a.id === input.admissionId);
  if (idx < 0) return { ok: false, error: "Admission not found." };
  const card = admissions[idx];
  const existing = feeLockRequests.find(
    (r) => r.admissionId === card.id && r.status === "pending_ho"
  );
  if (existing) return { ok: false, error: "A fee-lock request is already pending HO approval." };

  admissions[idx] = {
    ...card,
    stage: "pending_ho_fee",
    daysInStage: 0,
    monthlyTuition: input.monthlyTuition,
    admissionFee: input.admissionFee,
    registrationFee: input.admissionFee,
    discountType: input.discountType,
    discountValue: input.discountValue,
    feeNotes: input.feeNotes,
    invoiceNumber: undefined,
  };

  const request: FeeLockRequest = {
    id: `fl-${Date.now()}`,
    branchId: card.branchId,
    source: "admission",
    status: "pending_ho",
    studentName: card.studentName,
    admissionId: card.id,
    monthlyTuition: input.monthlyTuition,
    admissionFee: input.admissionFee,
    discountType: input.discountType,
    discountValue: input.discountValue,
    feeNotes: input.feeNotes,
    feePlan: input.feePlan ?? card.program,
    requestedBy: input.requestedBy ?? "Branch Admin",
    requestedAt: new Date().toISOString(),
  };
  feeLockRequests.unshift(request);
  return { ok: true, request, admission: admissions[idx] };
}

/** HO approves → student/admission becomes pending payment (fee locked) */
export async function decideFeeLockRequest(
  id: string,
  decision: "approved" | "rejected",
  opts?: { decidedBy?: string; hoNotes?: string }
): Promise<{ ok: true; request: FeeLockRequest } | { ok: false; error: string }> {
  const idx = feeLockRequests.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, error: "Request not found." };
  const req = feeLockRequests[idx];
  if (req.status !== "pending_ho") {
    return { ok: false, error: "Only pending HO requests can be decided." };
  }

  if (decision === "rejected") {
    if (req.admissionId) {
      const aIdx = admissions.findIndex((a) => a.id === req.admissionId);
      if (aIdx >= 0 && admissions[aIdx].stage === "pending_ho_fee") {
        admissions[aIdx] = {
          ...admissions[aIdx],
          stage: "meeting_test_scheduled",
          daysInStage: 0,
        };
      }
    }
    feeLockRequests[idx] = {
      ...req,
      status: "rejected",
      decidedBy: opts?.decidedBy ?? "Head Office",
      decidedAt: new Date().toISOString(),
      hoNotes: opts?.hoNotes,
    };
    return { ok: true, request: feeLockRequests[idx] };
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  if (req.studentId) {
    const student = await updateStudentRecord(
      req.studentId,
      {
        status: "pending_first_payment",
        feePlan: req.feePlan ?? undefined,
      },
      { allowPendingPayment: true }
    );
    if (!student) return { ok: false, error: "Could not lock student fees." };
  }

  if (req.admissionId) {
    const aIdx = admissions.findIndex((a) => a.id === req.admissionId);
    if (aIdx >= 0) {
      admissions[aIdx] = {
        ...admissions[aIdx],
        stage: "enrol_unpaid",
        daysInStage: 0,
        monthlyTuition: req.monthlyTuition,
        admissionFee: req.admissionFee,
        registrationFee: req.admissionFee,
        discountType: req.discountType,
        discountValue: req.discountValue,
        feeNotes: req.feeNotes,
        invoiceNumber,
      };
    }
  }

  feeLockRequests[idx] = {
    ...req,
    status: "approved",
    decidedBy: opts?.decidedBy ?? "Head Office",
    decidedAt: new Date().toISOString(),
    hoNotes: opts?.hoNotes,
    invoiceNumber,
  };
  return { ok: true, request: feeLockRequests[idx] };
}

/** Public / invite enrollment — create student only after staging HO fee-lock request */
export async function requestEnrollmentFeeLock(input: {
  student: Student;
  monthlyTuition?: number;
  admissionFee?: number;
  feeNotes?: string;
  requestedBy?: string;
}): Promise<{ ok: true; request: FeeLockRequest; student: Student } | { ok: false; error: string }> {
  const student: Student = {
    ...input.student,
    status: "inquiry" as StudentStatus,
  };
  students.unshift(student);
  const result = await requestStudentFeeLock({
    studentId: student.id,
    monthlyTuition: input.monthlyTuition,
    admissionFee: input.admissionFee,
    feeNotes: input.feeNotes ?? "Public enrollment — HO fee lock before pending payment",
    requestedBy: input.requestedBy ?? "Online enrollment",
  });
  if (!result.ok) {
    const i = students.findIndex((s) => s.id === student.id);
    if (i >= 0) students.splice(i, 1);
    return result;
  }
  feeLockRequests[0] = { ...result.request, source: "enrollment" };
  return { ok: true, request: feeLockRequests[0], student };
}

/** Move enrolled student to another campus + class */
export async function transferStudentBranch(
  id: string,
  input: { branchId: string; classId: string; className: string; notes?: string }
): Promise<Student | undefined> {
  const row = students.find((s) => s.id === id);
  if (!row) return undefined;
  if (row.branchId === input.branchId && row.classId === input.classId) return row;
  return updateStudentRecord(id, {
    previousBranchId: row.branchId,
    branchId: input.branchId,
    classId: input.classId,
    className: input.className,
  });
}

/** Withdraw student from campus (inactive — not billable) */
export async function withdrawStudent(
  id: string,
  input: { leaveDate: string; reason?: string }
): Promise<Student | undefined> {
  return updateStudentRecord(id, {
    status: "inactive",
    leaveDate: input.leaveDate,
  });
}

/** Rejoin a withdrawn / alumni student */
export async function rejoinStudent(
  id: string,
  input: {
    branchId: string;
    classId: string;
    className: string;
    rejoinDate?: string;
  }
): Promise<Student | undefined> {
  const row = students.find((s) => s.id === id);
  if (!row) return undefined;
  return updateStudentRecord(id, {
    status: "active",
    leaveDate: undefined,
    rejoinDate: input.rejoinDate ?? new Date().toISOString().slice(0, 10),
    previousBranchId: row.branchId !== input.branchId ? row.branchId : row.previousBranchId,
    branchId: input.branchId,
    classId: input.classId,
    className: input.className,
  });
}

// TODO: Replace with API call to /api/parents
export async function getParentsByIds(ids: string[]) {
  return parents.filter((p) => ids.includes(p.id));
}

function syncInvoiceStatuses(asOf = todayIso()) {
  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "partial") continue;
    if (isChallanExpired(inv.validityDate, asOf)) inv.status = "expired";
    else if (isPastDue(inv.dueDate, asOf)) inv.status = "overdue";
    else inv.status = "pending";
  }
}

// TODO: Replace with API call to /api/invoices
export async function getInvoices(branchId?: string): Promise<Invoice[]> {
  syncInvoiceStatuses();
  if (!branchId) return invoices;
  return invoices.filter((i) => i.branchId === branchId);
}

// TODO: Replace with API call to /api/invoices/:id
export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  syncInvoiceStatuses();
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
  /** Optional override; default = issue + 7 days */
  dueDate?: string;
  issueDate?: string;
  currency?: "PKR";
  includeExtras?: boolean;
  feeNotes?: string;
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
  const issueDate = input.issueDate ?? todayIso();
  const month = billingMonthLabel(issueDate);
  const dueDate = challanDueDate(issueDate, input.dueDate);
  const validityDate = challanValidityDate(issueDate);

  const lineItems: LineItem[] = [
    {
      id: `li-tuition-${Date.now()}`,
      description: `${input.planType} ${month}`,
      amount: input.amount,
    },
  ];
  if (admissionFee > 0) {
    lineItems.push({
      id: `li-adm-${Date.now()}`,
      description: `Admission fee ${month}`,
      amount: admissionFee,
    });
  }
  extras.forEach((e, i) => {
    lineItems.push({
      id: `li-ex-${e.id}-${i}`,
      description: `${e.label} ${month}`,
      amount: e.amount,
    });
  });

  const consumerNumber = String(10000 + students.findIndex((s) => s.id === student.id) + 691);
  const grNumber = String(45000 + students.findIndex((s) => s.id === student.id) + 341);

  let status: Invoice["status"] = "pending";
  if (isChallanExpired(validityDate)) status = "expired";
  else if (isPastDue(dueDate)) status = "overdue";

  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    consumerNumber,
    grNumber,
    studentId: student.id,
    branchId: student.branchId,
    planType: input.planType,
    billingMonth: month,
    amount: netAmount,
    amountAfterDue: netAmount + LATE_FEE_AFTER_DUE,
    lateFeeAfterDue: LATE_FEE_AFTER_DUE,
    expirySurcharge: EXPIRY_SURCHARGE,
    currency: input.currency ?? "PKR",
    issueDate,
    dueDate,
    validityDate,
    status,
    lineItems,
    feeNotes: input.feeNotes,
  };
  invoices.unshift(invoice);
  return { ok: true, invoice };
}

/** Refresh pending → overdue / expired from due & validity dates */
export async function refreshInvoiceStatuses(): Promise<Invoice[]> {
  syncInvoiceStatuses();
  return invoices;
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

/** Transfer employee to another campus */
export async function transferStaffBranch(
  id: string,
  input: { branchId: string }
): Promise<Staff | undefined> {
  const row = staff.find((s) => s.id === id);
  if (!row) return undefined;
  if (row.branchId === input.branchId) return row;
  return updateStaffRecord(id, {
    previousBranchId: row.branchId,
    branchId: input.branchId,
  });
}

/** Withdraw employee (resign / inactive / fire) — off payroll */
export async function withdrawStaff(
  id: string,
  input: { status: Exclude<StaffStatus, "active">; endDate: string }
): Promise<Staff | undefined> {
  return updateStaffRecord(id, {
    status: input.status,
    endDate: input.endDate,
  });
}

/** Rehire / reactivate employee onto payroll */
export async function rejoinStaff(
  id: string,
  input: { branchId?: string; rejoinDate?: string }
): Promise<Staff | undefined> {
  const row = staff.find((s) => s.id === id);
  if (!row) return undefined;
  const branchId = input.branchId ?? row.branchId;
  return updateStaffRecord(id, {
    status: "active",
    endDate: undefined,
    rejoinDate: input.rejoinDate ?? new Date().toISOString().slice(0, 10),
    previousBranchId: branchId !== row.branchId ? row.branchId : row.previousBranchId,
    branchId,
  });
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
  const totalAmount = requisitionTotal(input.items);
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
    kind: input.kind,
    forMonth: input.forMonth,
    deliveryDate: input.deliveryDate,
    hoNotes: input.hoNotes,
  };
  purchaseRequisitions.unshift(pr);
  return pr;
}

/**
 * Advance HO procurement: price/bill → pay → dispatch → receive (stock to branch).
 * Pass `items` when generating bill to set per-item amounts.
 */
export async function advancePurchaseRequisition(
  id: string,
  nextStatus: PRStatus,
  opts?: {
    items?: PurchaseRequisition["items"];
    vendor?: string;
    deliveryDate?: string;
    hoNotes?: string;
  }
): Promise<{ ok: true; pr: PurchaseRequisition } | { ok: false; error: string }> {
  const pr = purchaseRequisitions.find((p) => p.id === id);
  if (!pr) return { ok: false, error: "Requisition not found." };

  const today = new Date().toISOString().slice(0, 10);
  // Normalize legacy "approved" into the new pipeline entry point
  const from: Exclude<PRStatus, "approved"> =
    pr.status === "approved" ? "pending" : (pr.status as Exclude<PRStatus, "approved">);

  if (nextStatus === "rejected") {
    if (from !== "pending") {
      return { ok: false, error: "Only pending requisitions can be rejected." };
    }
    pr.status = "rejected";
    if (opts?.hoNotes) pr.hoNotes = opts.hoNotes;
    return { ok: true, pr };
  }

  const allowed: Partial<Record<PRStatus, PRStatus[]>> = {
    pending: ["billed"],
    billed: ["paid"],
    paid: ["dispatched"],
    dispatched: ["received"],
  };
  if (!allowed[from]?.includes(nextStatus)) {
    return { ok: false, error: `Cannot move from ${pr.status} to ${nextStatus}.` };
  }

  if (opts?.items) {
    pr.items = opts.items;
    pr.totalAmount = requisitionTotal(pr.items);
  }
  if (opts?.vendor !== undefined) pr.vendor = opts.vendor || undefined;
  if (opts?.deliveryDate) pr.deliveryDate = opts.deliveryDate;
  if (opts?.hoNotes !== undefined) pr.hoNotes = opts.hoNotes || undefined;

  if (nextStatus === "billed") {
    if (pr.items.some((i) => i.unitPrice < 0 || i.qty <= 0)) {
      return { ok: false, error: "Every line needs qty and a non-negative unit amount." };
    }
    if (pr.totalAmount <= 0) {
      return { ok: false, error: "Enter per-item amounts before generating the bill." };
    }
    pr.billNumber = pr.billNumber ?? `BILL-PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    pr.billedAt = today;
    pr.totalAmount = requisitionTotal(pr.items);
  }
  if (nextStatus === "paid") pr.paidAt = today;
  if (nextStatus === "dispatched") pr.dispatchedAt = today;
  if (nextStatus === "received") {
    pr.receivedAt = today;
    // Stock only catalog-linked lines that are physical inventory (skip courses)
    for (const line of pr.items) {
      if (!line.itemId) continue;
      const catalog = inventoryItems.find((i) => i.id === line.itemId);
      if (catalog?.category === "courses") continue;
      await adjustStock({ itemId: line.itemId, branchId: pr.branchId, delta: line.qty });
    }
  }

  pr.status = nextStatus;
  return { ok: true, pr };
}

/** @deprecated Prefer advancePurchaseRequisition — kept for simple reject/legacy */
export async function updatePurchaseRequisitionStatus(
  id: string,
  status: PRStatus
): Promise<PurchaseRequisition | undefined> {
  const result = await advancePurchaseRequisition(id, status);
  return result.ok ? result.pr : undefined;
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
export async function getTrainingVideos(opts?: {
  audience?: TrainingAudience;
  topic?: TrainingTopic;
  activeOnly?: boolean;
}): Promise<TrainingVideo[]> {
  let list = [...trainingVideos];
  if (opts?.activeOnly !== false) list = list.filter((v) => v.active !== false);
  if (opts?.audience) list = list.filter((v) => v.audience === opts.audience);
  if (opts?.topic) list = list.filter((v) => v.topic === opts.topic);
  return list;
}

export async function getTrainingVideoById(id: string): Promise<TrainingVideo | undefined> {
  return trainingVideos.find((v) => v.id === id);
}

const therapySessions: TherapySession[] = [
  {
    id: "ts1",
    studentId: "s1",
    date: "2026-07-20",
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
    date: "2026-07-13",
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

// TODO: Replace with API call to /api/therapy/sessions
export async function getTherapySessions(studentId?: string): Promise<TherapySession[]> {
  if (studentId) return therapySessions.filter((s) => s.studentId === studentId);
  return therapySessions;
}

export async function createTherapySession(
  input: Omit<TherapySession, "id" | "date" | "goalsAchieved"> & {
    date?: string;
    goalsAchieved?: string[];
  }
): Promise<TherapySession> {
  const session: TherapySession = {
    id: `ts-${Date.now()}`,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    studentId: input.studentId,
    therapistName: input.therapistName,
    duration: input.duration,
    types: input.types,
    subjective: input.subjective,
    objective: input.objective,
    assessment: input.assessment,
    plan: input.plan,
    complianceScore: input.complianceScore,
    goalsAchieved: input.goalsAchieved ?? [],
  };
  therapySessions.unshift(session);
  return session;
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

export async function getClasses(branchId?: string): Promise<ClassRoom[]> {
  if (!branchId) return classes;
  return classes.filter((c) => c.branchId === branchId);
}

export async function getClassById(id: string): Promise<ClassRoom | undefined> {
  return classes.find((c) => c.id === id);
}

export async function updateClassRoom(
  id: string,
  patch: Partial<Pick<ClassRoom, "name" | "teacherId" | "capacity" | "classGroup" | "ageBand">>
): Promise<ClassRoom | undefined> {
  const idx = classes.findIndex((c) => c.id === id);
  if (idx < 0) return undefined;
  if (patch.teacherId) {
    const teacher = staff.find((s) => s.id === patch.teacherId);
    if (!teacher || teacher.branchId !== classes[idx].branchId) {
      return undefined;
    }
  }
  classes[idx] = { ...classes[idx], ...patch, id };
  return classes[idx];
}

/** Assign student to a classroom (syncs branch + className) */
export async function assignStudentToClass(
  studentId: string,
  classId: string
): Promise<{ ok: true; student: Student } | { ok: false; error: string }> {
  const student = students.find((s) => s.id === studentId);
  const room = classes.find((c) => c.id === classId);
  if (!student) return { ok: false, error: "Student not found." };
  if (!room) return { ok: false, error: "Classroom not found." };
  student.previousBranchId =
    student.branchId !== room.branchId ? student.branchId : student.previousBranchId;
  student.branchId = room.branchId;
  student.classId = room.id;
  student.className = room.name;
  return { ok: true, student };
}

export async function getClassroomActivities(opts?: {
  classId?: string;
  studentId?: string;
  branchId?: string;
  parentsOnly?: boolean;
}): Promise<ClassroomActivity[]> {
  let list = [...classroomActivities];
  if (opts?.classId) list = list.filter((a) => a.classId === opts.classId);
  if (opts?.studentId) list = list.filter((a) => a.studentId === opts.studentId);
  if (opts?.branchId) list = list.filter((a) => a.branchId === opts.branchId);
  if (opts?.parentsOnly) list = list.filter((a) => a.visibleToParents);
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createClassroomActivity(
  input: Omit<ClassroomActivity, "id" | "createdAt" | "time"> & {
    time?: string;
    createdAt?: string;
  }
): Promise<ClassroomActivity> {
  const now = new Date();
  const activity: ClassroomActivity = {
    ...input,
    id: `act-${Date.now()}`,
    createdAt: input.createdAt ?? now.toISOString(),
    time:
      input.time ??
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    visibleToParents: input.visibleToParents ?? true,
  };
  classroomActivities.unshift(activity);
  return activity;
}

// TODO: Replace with API call to /api/services
export async function getServiceOfferings(activeOnly = false): Promise<ServiceOffering[]> {
  if (!activeOnly) return serviceOfferings;
  return serviceOfferings.filter((s) => s.active);
}

export async function getServiceOfferingById(id: string): Promise<ServiceOffering | undefined> {
  return serviceOfferings.find((s) => s.id === id);
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
