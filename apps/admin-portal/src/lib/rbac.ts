/**
 * Role-based access for the ERP UI — the single place to change who can see or do what.
 *
 * `source: "api"` rules copy the backend's role / authority lists from the API
 * reference exactly, so the UI never offers an action the API would refuse.
 * `source: "provisional"` rules cover modules with no endpoint yet; replace them
 * with the backend's lists as each module is integrated.
 *
 * Pure TypeScript (no React, no "use client") — Edge middleware imports it to
 * guard routes on the server, components import it to hide menus and buttons.
 * The backend still enforces every rule; this only decides what the UI shows.
 */

export const Roles = {
  SuperAdmin: "SUPER_ADMIN",
  PlatformAdmin: "PLATFORM_ADMIN",
  CompanyAdmin: "COMPANY_ADMIN",
  BranchAdmin: "BRANCH_ADMIN",
  Admin: "ADMIN",
  Staff: "STAFF",
  Teacher: "TEACHER",
  Accountant: "ACCOUNTANT",
  FinanceAdmin: "FINANCE_ADMIN",
  ReadonlyAuditor: "READONLY_AUDITOR",
  Parent: "PARENT",
  // Older role names some tokens may still carry
  InventoryManager: "INVENTORY_MANAGER",
  TempSubstituteTeacher: "TEMP_SUBSTITUTE_TEACHER",
} as const;

/** Backend permission authorities (JWT `permissions`). */
export const Authorities = {
  InquiryCreate: "INQUIRY_CREATE",
  InquiryRead: "INQUIRY_READ",
  InquiryUpdate: "INQUIRY_UPDATE",
  FeeBranchApprove: "FEE_BRANCH_APPROVE",
  FeeLock: "FEE_LOCK",
  FeeManage: "FEE_MANAGE",
  FeeRead: "FEE_READ",
  PaymentConfirm: "PAYMENT_CONFIRM",
  StudentCreate: "STUDENT_CREATE",
  StudentRead: "STUDENT_READ",
  StudentUpdate: "STUDENT_UPDATE",
  StudentDelete: "STUDENT_DELETE",
  // Issued at login (seen 2026-10-18) — not yet in the API reference
  CompanyRead: "COMPANY_READ",
  CompanyManage: "COMPANY_MANAGE",
  BranchManage: "BRANCH_MANAGE",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PLATFORM_ADMIN: "Platform Admin",
  COMPANY_ADMIN: "Company Admin",
  BRANCH_ADMIN: "Branch Admin",
  ADMIN: "Admin",
  STAFF: "Admissions Staff",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  FINANCE_ADMIN: "Finance Admin",
  READONLY_AUDITOR: "Auditor (read-only)",
  PARENT: "Parent",
  INVENTORY_MANAGER: "Inventory Manager",
  TEMP_SUBSTITUTE_TEACHER: "Substitute Teacher",
};

const R = Roles;
const A = Authorities;

/** Platform / company owners — every API list includes them. */
const TOP = [R.SuperAdmin, R.PlatformAdmin, R.CompanyAdmin] as const;
/** Everyone who works inside the ERP (parents use the parent portal). */
const ALL_STAFF = [
  ...TOP,
  R.BranchAdmin,
  R.Admin,
  R.Staff,
  R.Teacher,
  R.Accountant,
  R.FinanceAdmin,
  R.ReadonlyAuditor,
  R.InventoryManager,
  R.TempSubstituteTeacher,
] as const;

type Rule = {
  /** Any of these roles grants it */
  roles: readonly string[];
  /** …or this authority in the JWT `permissions` */
  authority?: string;
  source: "api" | "provisional";
};

export const CAPABILITIES = {
  // ── Admissions (API §6, §8) ─────────────────────────────────────────
  "admissions.view": {
    roles: [...TOP, R.Admin, R.Staff, R.Teacher, R.BranchAdmin, R.ReadonlyAuditor],
    authority: A.InquiryRead,
    source: "api",
  },
  "admissions.create": {
    roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin],
    authority: A.InquiryCreate,
    source: "api",
  },
  /** Schedule tour / interview, manual & full-manual enrollment */
  "admissions.update": {
    roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin],
    authority: A.InquiryUpdate,
    source: "api",
  },
  "admissions.waitlist": { roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin], source: "api" },
  "admissions.transfer": { roles: [...TOP, R.Admin, R.BranchAdmin], source: "api" },

  // ── Fee approval chain (API §6.6–6.9) ───────────────────────────────
  "fees.propose": {
    roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin],
    authority: A.InquiryUpdate,
    source: "api",
  },
  "fees.branchApprove": {
    roles: [...TOP, R.Admin, R.BranchAdmin],
    authority: A.FeeBranchApprove,
    source: "api",
  },
  "fees.lock": {
    roles: [...TOP, R.Admin, R.Accountant, R.FinanceAdmin],
    authority: A.FeeLock,
    source: "api",
  },
  /**
   * Company (Head Office) fee approval queue. Same roles as the lock, but no
   * authority fallback — a branch admin must never see this queue.
   */
  "fees.companyApprove": {
    roles: [...TOP, R.Admin, R.Accountant, R.FinanceAdmin],
    source: "api",
  },
  "payments.confirm": {
    roles: [...TOP, R.Admin, R.Accountant, R.FinanceAdmin],
    authority: A.PaymentConfirm,
    source: "api",
  },

  // ── Fee management (API §5) ─────────────────────────────────────────
  "fees.read": {
    roles: [...TOP, R.Admin, R.FinanceAdmin, R.Accountant, R.Staff, R.BranchAdmin],
    authority: A.FeeRead,
    source: "api",
  },
  "fees.manage": {
    roles: [...TOP, R.Admin, R.FinanceAdmin],
    authority: A.FeeManage,
    source: "api",
  },

  // ── Students (API §4) ───────────────────────────────────────────────
  "students.read": {
    roles: [...TOP, R.Admin, R.Teacher, R.Staff, R.BranchAdmin, R.ReadonlyAuditor],
    authority: A.StudentRead,
    source: "api",
  },
  "students.create": {
    roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin],
    authority: A.StudentCreate,
    source: "api",
  },
  "students.update": {
    roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin],
    authority: A.StudentUpdate,
    source: "api",
  },
  "students.delete": {
    roles: [...TOP, R.Admin],
    authority: A.StudentDelete,
    source: "api",
  },

  // ── Platform & security (API §3, §10) ───────────────────────────────
  "companies.register": { roles: [R.SuperAdmin], source: "api" },
  "security.auditLogs": {
    roles: [R.SuperAdmin, R.PlatformAdmin, R.ReadonlyAuditor],
    source: "api",
  },
  "security.roleRequest": {
    roles: [R.SuperAdmin, R.PlatformAdmin, R.CompanyAdmin, R.BranchAdmin],
    source: "api",
  },
  "security.roleReview": { roles: [R.SuperAdmin, R.PlatformAdmin, R.CompanyAdmin], source: "api" },

  /** Branch staff login accounts (`/branches/{branchId}/staff`) — the API doc names no roles yet */
  "staff.accounts": { roles: [...TOP, R.Admin, R.BranchAdmin], source: "provisional" },

  // ── Modules without an API yet (provisional) ────────────────────────
  /** Staff hiring rides on the admissions endpoints today */
  "hr.manage": { roles: [...TOP, R.Admin, R.BranchAdmin], source: "provisional" },
  "classroom.view": {
    roles: [...TOP, R.Admin, R.Staff, R.Teacher, R.TempSubstituteTeacher, R.BranchAdmin],
    source: "provisional",
  },
  "family.manage": { roles: [...TOP, R.Admin, R.Staff, R.BranchAdmin], source: "provisional" },
  "finance.view": {
    roles: [...TOP, R.Admin, R.Accountant, R.FinanceAdmin, R.BranchAdmin, R.ReadonlyAuditor],
    authority: A.FeeRead,
    source: "provisional",
  },
  "operations.manage": {
    roles: [...TOP, R.Admin, R.BranchAdmin, R.InventoryManager],
    source: "provisional",
  },
  "reports.view": {
    roles: [...TOP, R.Admin, R.BranchAdmin, R.FinanceAdmin, R.ReadonlyAuditor],
    source: "provisional",
  },
  "settings.manage": { roles: [...TOP, R.Admin], source: "provisional" },
  "erp.access": { roles: ALL_STAFF, source: "provisional" },
} satisfies Record<string, Rule>;

export type Capability = keyof typeof CAPABILITIES;

export type AccessSubject = { roles: readonly string[]; permissions: readonly string[] };

/**
 * Master switch. `NEXT_PUBLIC_RBAC_ENFORCE=true` applies the rules above;
 * `false` lets every signed-in user see and do everything (development).
 * Unset: off in development, on in production builds.
 */
export function rbacEnforced(): boolean {
  const flag = process.env.NEXT_PUBLIC_RBAC_ENFORCE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function can(user: AccessSubject | null | undefined, capability: Capability): boolean {
  if (!user) return false;
  if (!rbacEnforced()) return true;
  const rule: Rule = CAPABILITIES[capability];
  if (user.roles.some((r) => rule.roles.includes(r))) return true;
  return !!rule.authority && user.permissions.includes(rule.authority);
}

/**
 * ERP routes → capability (after the /admin prefix is stripped). Most specific
 * first; the first prefix match wins. Unlisted ERP routes need `erp.access`.
 */
const ROUTE_RULES: [prefix: string, capability: Capability][] = [
  ["/admissions/new", "admissions.update"],
  ["/admissions/company-fee-approvals", "fees.companyApprove"],
  ["/admissions/branch-fee-approvals", "fees.branchApprove"],
  ["/admissions", "admissions.view"],
  ["/students", "students.read"],
  ["/billing/fee-locks", "fees.lock"],
  ["/billing/create", "fees.manage"],
  ["/billing", "finance.view"],
  ["/finance", "finance.view"],
  ["/hr/training", "erp.access"],
  ["/hr/leave", "erp.access"],
  ["/hr", "hr.manage"],
  ["/parents", "family.manage"],
  ["/communications", "family.manage"],
  ["/classrooms", "classroom.view"],
  ["/attendance", "classroom.view"],
  ["/academics", "classroom.view"],
  ["/therapy", "classroom.view"],
  ["/incidents", "classroom.view"],
  ["/inventory", "operations.manage"],
  ["/maintenance", "operations.manage"],
  ["/reports", "reports.view"],
  ["/workflows", "reports.view"],
  ["/settings", "settings.manage"],
  ["/design", "settings.manage"],
];

export function routeCapability(pathname: string): Capability {
  const hit = ROUTE_RULES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`));
  return hit ? hit[1] : "erp.access";
}

export function roleLabel(roles: readonly string[]): string {
  const first = roles[0];
  return first ? ROLE_LABELS[first] ?? first.replace(/_/g, " ").toLowerCase() : "";
}
