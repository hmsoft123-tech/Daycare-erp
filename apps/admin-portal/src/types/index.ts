export type BranchStatus = "healthy" | "attention";

export type StaffRole =
  | "admin"
  | "teacher"
  | "therapist"
  | "accountant"
  | "support"
  | "executive";

export type StudentStatus =
  | "active"
  | "inquiry"
  | "alumni"
  | "waitlist"
  | "pending_first_payment"
  | "inactive";

/** Employment status — resigned / fired / inactive are excluded from payroll & new entries */
export type StaffStatus = "active" | "resigned" | "fired" | "inactive";

export type InquiryType = "admission" | "employment" | "tour" | "general";

export type InvoiceStatus = "paid" | "overdue" | "pending" | "partial";

export type AttendanceStatus = "present" | "absent" | "late";

export type PRStatus = "pending" | "approved" | "rejected";

export type AdmissionStage =
  | "new_inquiry"
  | "meeting_test_scheduled"
  | "enrol_unpaid"
  | "paid"
  | "waitlist";

/** Short label on admission cards, e.g. Hot Lead / Sibling / Walk-in */
export type AdmissionTag =
  | "hot_lead"
  | "walk_in"
  | "referral"
  | "sibling"
  | "online"
  | "campaign";

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
  /** Generated at enrollment when record is saved to the portal */
  idCardNumber?: string;
  /**
   * Recurring extras / benefits / charges applied automatically when an invoice is generated.
   * Managed from the student profile.
   */
  extras?: StudentExtra[];
}

/** Extra line items attached to a student and billed on invoice generation */
export type StudentExtraKind = "benefit" | "addon" | "charge";

export interface StudentExtra {
  id: string;
  label: string;
  /** Amount in PKR added to each invoice while active */
  amount: number;
  kind: StudentExtraKind;
  active: boolean;
  notes?: string;
}

/** When an employee-file document is collected in the HR lifecycle */
export type EmployeeFilePhase = "hire" | "post_probation" | "ongoing" | "exit";

export type EmployeeFileSlotKey =
  | "cnic_self"
  | "cnic_family"
  | "last_degree"
  | "last_pay_stub"
  | "reference_letters"
  | "medical_test"
  | "job_application"
  | "interview_evaluation"
  | "demo_evaluation"
  | "signed_offer"
  | "signed_job_description"
  | "detailed_form"
  | "probation_evaluation"
  | "staff_id_card"
  | "induction_checklist"
  | "signed_hr_policies"
  | "annual_evaluation"
  | "promotion_letter"
  | "salary_revision"
  | "correction_letter"
  | "loan_advance"
  | "resignation_letter"
  | "termination_letter"
  | "retirement_letter";

export interface EmployeeFileEntry {
  key: EmployeeFileSlotKey;
  /** Mock filename when uploaded / recorded */
  fileName?: string;
  received: boolean;
  receivedAt?: string;
  notes?: string;
}

/** SDLC department shift used for salary / attendance expectations */
export type StaffShiftKey =
  | "administration"
  | "class_teacher"
  | "para_teacher_morning"
  | "para_teacher_evening"
  | "support_full_day";

/** Payroll line attached to a staff profile (mirrors student invoice extras) */
export type SalaryLineKind = "adjustment" | "allowance" | "deduction" | "overtime";

export interface SalaryLine {
  id: string;
  label: string;
  /** PKR — use negative amounts for deductions, or kind "deduction" with positive amount */
  amount: number;
  kind: SalaryLineKind;
  active: boolean;
  notes?: string;
}

/**
 * Salary determination (SDLC HR Policy) — set on staff profile;
 * active lines appear on payroll / pay-slip breakdown.
 */
export interface SalaryDetermination {
  /** Confidential bracket base for the position (monthly PKR) */
  baseSalary: number;
  shift: StaffShiftKey;
  educationLevel?: string;
  experienceYears?: number;
  /** Years served at SDLC — may differ salary within same position */
  yearsAtSdlc?: number;
  communicationNotes?: string;
  /** Active adjustments / allowances / deductions for payroll */
  lines: SalaryLine[];
  /** Employee acknowledged Salary & Leave / Hiring salary policy */
  policyAcknowledgedAt?: string;
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
  status: StaffStatus;
  /** Set when resigned / fired / marked inactive */
  endDate?: string;
  /** Generated at hire when record is saved to the portal */
  idCardNumber?: string;
  /** Probation end date (ISO date) — post-probation file slots unlock after this */
  probationEndDate?: string;
  /** Admin marks probation successfully completed */
  probationCompleted?: boolean;
  /** SDLC employee file checklist (a–x) */
  employeeFile?: EmployeeFileEntry[];
  /** Digital acknowledgment of HR policies (public / hire sign-off) */
  hrPoliciesSignedAt?: string;
  hrPoliciesSignature?: string;
  /** Salary determination — drives payroll breakdown */
  salary?: SalaryDetermination;
}

export type IdCardKind = "student" | "staff";

/** Printable portal ID card issued when the person is saved to the directory */
export interface PortalIdCard {
  id: string;
  kind: IdCardKind;
  cardNumber: string;
  personId: string;
  fullName: string;
  photo?: string;
  branchId: string;
  branchName: string;
  /** Class for students / role for staff */
  subtitle: string;
  secondaryLine?: string;
  issuedAt: string;
  validUntil: string;
  bloodGroup?: string;
  employeeId?: string;
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
  /** Optional link to inventory catalog */
  itemId?: string;
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

export type InventoryCategory =
  | "supplies"
  | "food"
  | "cleaning"
  | "therapy"
  | "playground"
  | "other";

/** Catalog item that can be stocked and requested via PRs */
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  active: boolean;
  notes?: string;
}

/** On-hand quantity per branch */
export interface StockLevel {
  id: string;
  itemId: string;
  branchId: string;
  qtyOnHand: number;
  updatedAt: string;
}

export type MeetingKind = "tour" | "test" | "interview" | "assessment";

export type DiscountType =
  | "none"
  | "percent"
  | "fixed"
  | "sibling"
  | "scholarship"
  | "staff"
  | "promo";

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
  /** Inquiry received time, e.g. "14:30" */
  inquiryTime: string;
  /** Card pill: Hot Lead, Walk-in, etc. */
  tag: AdmissionTag;
  /** Inquiry / lead type */
  type: InquiryType;
  /** Short notes shown on the card */
  description: string;
  email: string;
  inquiryType?: InquiryType;
  parentEmail?: string;
  parentPhone?: string;
  message?: string;
  classroom?: string;
  monthlyTuition?: number;
  /** Admission / registration fee */
  admissionFee?: number;
  registrationFee?: number;
  discountType?: DiscountType;
  discountValue?: number;
  feeNotes?: string;
  invoiceNumber?: string;
  /** Tour / meeting / test schedule */
  meetingKind?: MeetingKind;
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  meetingNotes?: string;
}

export type StaffInquiryStage =
  | "new_inquiry"
  | "interview_scheduled"
  | "offer_pending"
  | "hired"
  | "waitlist";

export type StaffInquiryTag =
  | "hot_lead"
  | "referral"
  | "walk_in"
  | "online"
  | "campus_posting"
  | "agency";

export type StaffInterviewKind = "phone" | "in_person" | "demo" | "panel";

export interface StaffInquiryCard {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Role applied for */
  role: StaffRole;
  branchId: string;
  stage: StaffInquiryStage;
  daysInStage: number;
  tag: StaffInquiryTag;
  description: string;
  experienceYears: number;
  inquiryTime: string;
  createdAt: string;
  avatar?: string;
  interviewKind?: StaffInterviewKind;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewNotes?: string;
  /** Monthly salary offer (PKR) */
  offeredSalary?: number;
  joiningDate?: string;
  employmentType?: "full_time" | "part_time" | "contract";
  offerNotes?: string;
  /** Probation length in months (default 3) */
  probationMonths?: number;
  /** Token for public hire application (/apply/[token]) */
  hireInviteToken?: string;
  /** Candidate / HR uploads collected before or at hire */
  employeeFile?: EmployeeFileEntry[];
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
