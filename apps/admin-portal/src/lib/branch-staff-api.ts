/**
 * Branch staff user accounts (`/api/v1/branches/{branchId}/staff`, through `/api/bff`):
 * login accounts for teachers, front-desk staff, accountants and branch admins.
 */

export type BranchStaffRole = "STAFF" | "TEACHER" | "ACCOUNTANT" | "BRANCH_ADMIN";

export const BRANCH_STAFF_ROLES: { value: BranchStaffRole; label: string }[] = [
  { value: "STAFF", label: "Staff (front desk / admissions)" },
  { value: "TEACHER", label: "Teacher" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "BRANCH_ADMIN", label: "Branch admin" },
];

/** `CreateBranchStaffRequest` */
export type CreateBranchStaff = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: BranchStaffRole;
  department?: string;
  designation?: string;
  active: boolean;
};

/** `BranchStaffResponse` */
export type ApiBranchStaff = {
  id: number;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  role?: string | null;
  branchId?: string | null;
  active?: boolean;
  createdAt?: string | null;
};

/** `BranchResponse` from `GET /hierarchy/branches` — used when the login carried no branch list */
export type ApiBranch = {
  id: number;
  name?: string | null;
  code?: string | null;
};

export function branchStaffPath(branchId: string): string {
  return `/branches/${encodeURIComponent(branchId)}/staff`;
}
