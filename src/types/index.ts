export type BranchStatus = "healthy" | "attention";

export type StaffRole =
  | "admin"
  | "teacher"
  | "therapist"
  | "accountant"
  | "support"
  | "executive";

export type StudentStatus = "active" | "inquiry" | "alumni" | "waitlist";

export type InvoiceStatus = "paid" | "overdue" | "pending" | "partial";

export type AttendanceStatus = "present" | "absent" | "late";

export type PRStatus = "pending" | "approved" | "rejected";

export type AdmissionStage =
  | "new_inquiry"
  | "tour_scheduled"
  | "waitlist"
  | "enrolled"
  | "rejected";

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  headCount: number;
  status: BranchStatus;
}

export interface Parent {
  id: string;
  name: string;
  relation: "father" | "mother" | "guardian";
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  bloodGroup: string;
  allergies: string[];
  branchId: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  status: StudentStatus;
  parentIds: string[];
  photo?: string;
  feePlan?: string;
  gender: "male" | "female";
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  branchId: string;
  employeeId: string;
  joinDate: string;
  phone: string;
  email: string;
  photo?: string;
  specializations?: string[];
}

export interface LineItem {
  id: string;
  description: string;
  amount: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  branchId: string;
  planType: string;
  amount: number;
  currency: "PKR";
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
}

export interface AttendanceRecord {
  studentId: string;
  date: string;
  classId: string;
  status: AttendanceStatus;
}

export interface PRLineItem {
  id: string;
  item: string;
  qty: number;
  unitPrice: number;
}

export interface PurchaseRequisition {
  id: string;
  branchId: string;
  requestedBy: string;
  date: string;
  items: PRLineItem[];
  totalAmount: number;
  status: PRStatus;
  vendor?: string;
  summary: string;
}

export interface AdmissionCard {
  id: string;
  studentName: string;
  age: number;
  parentName: string;
  program: string;
  branchId: string;
  stage: AdmissionStage;
  daysInStage: number;
  avatar?: string;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  branchId: string;
  teacherId: string;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface BranchRevenue {
  branchId: string;
  month: string;
  revenue: number;
}

export interface EnrollmentFeedItem {
  id: string;
  studentName: string;
  branchId: string;
  enrolledDate: string;
  status: StudentStatus;
  avatar?: string;
}

export interface TherapySession {
  id: string;
  studentId: string;
  date: string;
  therapistName: string;
  duration: number;
  types: string[];
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  complianceScore: number;
  goalsAchieved: string[];
}

export interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  category: "all" | "teachers" | "therapists";
  thumbnail?: string;
  progress: number;
  featured?: boolean;
}

export interface BranchScorecard {
  branchId: string;
  academic: number;
  hygiene: number;
  finance: number;
  overallGrade: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface MedicalIncident {
  id: string;
  studentId: string;
  date: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface StudentFilters {
  branchId?: string;
  status?: StudentStatus;
  search?: string;
}

export interface ContextState {
  contextId: string;
  contextType: "head_office" | "branch";
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
}
