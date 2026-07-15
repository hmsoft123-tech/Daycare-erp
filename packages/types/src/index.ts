/**
 * Shared domain models for Kinder Pilot multi-tenant SaaS.
 */

export type BranchStatus = "healthy" | "attention";

export type StaffRole =
  | "admin"
  | "teacher"
  | "therapist"
  | "accountant"
  | "support"
  | "executive"
  | "parent";

export type StudentStatus = "active" | "inquiry" | "alumni" | "waitlist" | "pending_first_payment";
export type InvoiceStatus = "paid" | "overdue" | "pending" | "partial";
export type AttendanceStatus = "present" | "absent" | "late";
export type PRStatus = "pending" | "approved" | "rejected";
export type AdmissionStage =
  | "new_inquiry"
  | "meeting_test_scheduled"
  | "enrol_unpaid"
  | "paid"
  | "waitlist";

export type InquiryType = "admission" | "employment" | "tour" | "general";

export type AdmissionTag =
  | "hot_lead"
  | "walk_in"
  | "referral"
  | "sibling"
  | "online"
  | "campaign";

export type UserType = "admin" | "staff" | "teacher" | "parent" | "executive";

/** School / organization (tenant) owning one or more branches */
export interface Tenant {
  id: string;
  slug: string;
  schoolName: string;
  customDomains: string[];
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  status: "active" | "suspended";
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  schoolName: string;
  /** Full brand scale derived server-side for CSS variables */
  palette?: Partial<Record<"50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900", string>>;
}

export interface Branch {
  id: string;
  tenantId: string;
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
  tenantId: string;
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
  tenantId: string;
  name: string;
  role: StaffRole;
  branchId: string;
  employeeId: string;
  joinDate: string;
  phone: string;
  email: string;
  photo?: string;
  specializations?: string[];
  permissions: string[];
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  userType: UserType;
  permissions: string[];
  branchIds: string[];
  photo?: string;
}

export interface LineItem {
  id: string;
  description: string;
  amount: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
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
  tenantId: string;
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
  tenantId: string;
  studentName: string;
  age: number;
  parentName: string;
  program: string;
  branchId: string;
  stage: AdmissionStage;
  daysInStage: number;
  avatar?: string;
  createdAt: string;
  tag: AdmissionTag;
  type: InquiryType;
  description: string;
  email: string;
}

export interface StudentFilters {
  branchId?: string;
  status?: StudentStatus;
  search?: string;
}

/** Canonical permission keys used by <HasPermission /> */
export const Permission = {
  StudentsRead: "students.read",
  StudentsWrite: "students.write",
  AdmissionsManage: "admissions.manage",
  BillingRead: "billing.read",
  BillingWrite: "billing.write",
  AttendanceMark: "attendance.mark",
  HrManage: "hr.manage",
  InventoryApprove: "inventory.approve",
  ReportsView: "reports.view",
  SettingsManage: "settings.manage",
  BranchSwitch: "branch.switch",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];
