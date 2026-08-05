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

export type InvoiceStatus = "paid" | "overdue" | "pending" | "partial" | "expired";

export type AttendanceStatus = "present" | "absent" | "late";

/**
 * HO procurement pipeline (SDLC requisition → bill → pay → dispatch → receive):
 * pending → billed → paid → dispatched → received | rejected
 */
export type PRStatus =
  | "pending"
  | "billed"
  | "paid"
  | "dispatched"
  | "received"
  | "rejected"
  /** @deprecated use billed / received — kept for older seeds during migration */
  | "approved";

/** SDLC requisition catalogue kinds + extras (books, courses, general inventory) */
export type RequisitionKind =
  | "stationery"
  | "groceries"
  | "toiletries"
  | "printed"
  | "books"
  | "courses"
  | "inventory"
  | "other";

export type AdmissionStage =
  | "new_inquiry"
  | "meeting_test_scheduled"
  /** Branch submitted fee package — awaiting Head Office fee-lock approval */
  | "pending_ho_fee"
  | "enrol_unpaid"
  | "paid"
  | "waitlist";

/**
 * Head Office must approve fee locking before a student/admission becomes
 * pending payment (parent portal lock / enrol unpaid).
 */
export type FeeLockRequestStatus = "pending_ho" | "approved" | "rejected";

export type FeeLockRequestSource = "student" | "admission" | "enrollment";

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
  /** Link to SDLC services catalogue plan (core class + tier) */
  servicePlanId?: string;
  gender: "male" | "female";
  /** Generated at enrollment when record is saved to the portal */
  idCardNumber?: string;
  /**
   * Recurring extras / benefits / charges applied automatically when an invoice is generated.
   * Managed from the student profile. Prefer `serviceId` when sourced from catalogue.
   */
  extras?: StudentExtra[];
  /** Set when withdrawn / left (status inactive or alumni) */
  leaveDate?: string;
  /** Set when reactivated after withdraw / alumni */
  rejoinDate?: string;
  /** Previous campus before last branch transfer */
  previousBranchId?: string;
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
  /** Optional link to Services catalogue offering */
  serviceId?: string;
}

/** SDLC Fee Schedule 2026–2027 catalogue categories */
export type ServiceCategory =
  | "core_class"
  | "extra_care"
  | "value_added"
  | "after_school"
  | "learning"
  | "recreational"
  | "registration";

/** Care / plan tier — Base hours + Lite/Plus/Pro extra care (SDLC) */
export type ServiceTier = "base" | "lite" | "plus" | "pro";

/**
 * Billable service / class / plus offering from SDLC fee sheet.
 * Core classes have Base monthly + optional Extra Care Lite/Plus/Pro.
 * Value-added, learning, recreational attach as student extras.
 */
export interface ServiceOffering {
  id: string;
  code: string;
  name: string;
  category: ServiceCategory;
  /** Age / grade band, e.g. "40 days – 1.2 years" */
  ageBand?: string;
  schedule?: string;
  description?: string;
  tier?: ServiceTier;
  /** Links Extra Care / tuition lines to a core class group, e.g. "infant" */
  classGroup?: string;
  admissionFee?: number;
  monthlyFee: number;
  /** When true, annual = monthly fee (SDLC rule) */
  annualSameAsMonthly?: boolean;
  annualFee?: number;
  registrationFee?: number;
  /** Shown as selectable add-on / student extra */
  billableAsExtra: boolean;
  active: boolean;
  sessionYear: string;
  sortOrder: number;
}

/** When an employee-file document is collected in the HR lifecycle */
export type EmployeeFilePhase = "hire" | "post_probation" | "ongoing" | "exit";

export type EmployeeFileSlotKey =
  | "passport_photo"
  | "cnic_self"
  | "cnic_family"
  | "last_degree"
  | "last_pay_stub"
  | "reference_letters"
  | "covid_vaccination"
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

export type SkillLevel = "strong" | "weak" | "nil";

export interface EducationRow {
  level: "masters" | "bachelors" | "diploma" | "hsc" | "ssc";
  institute: string;
  subject: string;
  year: string;
}

export interface WorkExperienceRow {
  company: string;
  jobTitle: string;
  joiningLeaving: string;
  salary: string;
}

export interface AdditionalCourseRow {
  title: string;
  institute: string;
  duration: string;
  date: string;
}

export interface LanguageSkillRow {
  language: "urdu" | "english";
  written: SkillLevel;
  spoken: SkillLevel;
  understanding: SkillLevel;
}

export interface ItSkillRow {
  skill: string;
  level: SkillLevel;
}

export interface ApplicationReference {
  name: string;
  relation: string;
  cnic: string;
  contact: string;
  occupation: string;
  duration: string;
}

/** SDLC Employee Application Form (ANNEX) — collected at hire */
export interface JobApplicationForm {
  fullName: string;
  cnic: string;
  designation: string;
  branchId: string;
  fatherHusbandName: string;
  dateOfBirth: string;
  maritalStatus: "single" | "married" | "widowed" | "divorced" | "";
  homeAddress: string;
  homePhone: string;
  mobilePhone: string;
  email: string;
  passportPhotoName?: string;
  education: EducationRow[];
  workExperience: WorkExperienceRow[];
  additionalCourses: AdditionalCourseRow[];
  languages: LanguageSkillRow[];
  itSkills: ItSkillRow[];
  reference1: ApplicationReference;
  reference2: ApplicationReference;
  knowAboutSdlc: string;
  whyBestSuited: string;
  respectMeaning: string;
  techInEducation: string;
  documentationImportance: string;
  /** Official use (HR) */
  jobHours?: string;
  joiningDate?: string;
  salary?: number;
  firstInterviewDate?: string;
  demonstrationDate?: string;
  trainingPeriod?: string;
  staffCode?: string;
  appliedAt?: string;
  signatureDataUrl?: string;
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
  /** Completed SDLC employee application form */
  jobApplication?: JobApplicationForm;
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
  /** Set when reactivated after resign / inactive / fired */
  rejoinDate?: string;
  /** Previous campus before last branch transfer */
  previousBranchId?: string;
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
  /** Bank consumer / class ID shown on challan (e.g. 10694) */
  consumerNumber: string;
  /** G.R. number on challan */
  grNumber: string;
  studentId: string;
  branchId: string;
  planType: string;
  /** Billing month label, e.g. March (2026) */
  billingMonth: string;
  /** Payable before due date (base net) */
  amount: number;
  /** Payable after due date (= amount + lateFeeAfterDue) */
  amountAfterDue: number;
  /** Late charge applied after due date (SDLC: Rs. 1000) */
  lateFeeAfterDue: number;
  /** Extra surcharge if unpaid through validity — added as arrears next cycle (SDLC: Rs. 1000) */
  expirySurcharge: number;
  currency: "PKR";
  /** Challan issue date */
  issueDate: string;
  dueDate: string;
  /** Validity / expiry — challan invalid after this (issue + 25 days inclusive) */
  validityDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  feeNotes?: string;
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
  /** Per-unit amount (Rs.) — editable by HO when generating bill */
  unitPrice: number;
  /** Brand / specification (SDLC form) */
  brand?: string;
  /** Remarks or requested amount note from branch */
  remarks?: string;
  /** Optional link to inventory catalog — stocked on receive */
  itemId?: string;
}

export interface PurchaseRequisition {
  id: string;
  branchId: string;
  requestedBy: string;
  date: string;
  items: PRLineItem[];
  /** Sum of qty × unitPrice (bill amount after HO pricing) */
  totalAmount: number;
  status: PRStatus;
  vendor?: string;
  summary: string;
  /** SDLC catalogue form type */
  kind: RequisitionKind;
  /** Month the requisition is for, e.g. August (2026) */
  forMonth?: string;
  /** Filled by Head Office when billing / scheduling delivery */
  deliveryDate?: string;
  billNumber?: string;
  billedAt?: string;
  paidAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  hoNotes?: string;
}

export type InventoryCategory =
  | "supplies"
  | "stationery"
  | "food"
  | "groceries"
  | "cleaning"
  | "toiletries"
  | "printed"
  | "books"
  | "courses"
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

export interface FeeLockRequest {
  id: string;
  branchId: string;
  source: FeeLockRequestSource;
  status: FeeLockRequestStatus;
  studentName: string;
  studentId?: string;
  admissionId?: string;
  /** Prior student status before lock (restored on reject when applicable) */
  priorStudentStatus?: StudentStatus;
  monthlyTuition: number;
  admissionFee: number;
  discountType?: DiscountType;
  discountValue?: number;
  feeNotes?: string;
  feePlan?: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  hoNotes?: string;
  invoiceNumber?: string;
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
  /** Maps to ServiceOffering.classGroup (infant, playgroup, …) */
  classGroup?: string;
  ageBand?: string;
  capacity?: number;
}

/** Teacher daily log — visible on parent portal activity feed */
export type ClassroomActivityType =
  | "meal"
  | "nap"
  | "activity"
  | "note"
  | "photo"
  | "checkin"
  | "checkout"
  | "potty"
  | "learning";

export interface ClassroomActivity {
  id: string;
  type: ClassroomActivityType;
  title: string;
  body: string;
  /** Display time e.g. 12:40 PM */
  time: string;
  createdAt: string;
  studentId: string;
  studentName: string;
  classId: string;
  branchId: string;
  teacherId: string;
  teacherName: string;
  imageUrl?: string;
  /** When true, shown on parent portal feed */
  visibleToParents: boolean;
  likes?: number;
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

/** Who the video is for in the Training & Induction hub */
export type TrainingAudience = "staff" | "parents";

/** Staff content buckets */
export type StaffTrainingTopic =
  | "induction"
  | "policy"
  | "activity"
  | "safety"
  | "therapy";

/** Parent content buckets */
export type ParentTrainingTopic = "orientation" | "app_guide" | "policy";

export type TrainingTopic = StaffTrainingTopic | ParentTrainingTopic;

/** Role filter for staff library (legacy + audience targeting) */
export type TrainingRoleCategory = "all" | "teachers" | "therapists";

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  audience: TrainingAudience;
  topic: TrainingTopic;
  /** YouTube video id (watch?v=…) */
  youtubeId: string;
  /** Staff role targeting; ignored for parent videos */
  category: TrainingRoleCategory;
  thumbnail?: string;
  /** @deprecated prefer per-user completion store */
  progress?: number;
  featured?: boolean;
  active?: boolean;
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
