/**
 * Mock hire-application invite tokens — replace with Laravel API.
 * Public URL: /apply/[token] (hiring-time employee file fields only)
 */

import type { EmployeeFileEntry, StaffRole } from "@/types";

export type HireInviteStatus = "pending" | "completed" | "expired" | "revoked";

export type HireInvitePrefill = {
  name?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  branchId?: string;
  offeredSalary?: number;
  joiningDate?: string;
  employmentType?: "full_time" | "part_time" | "contract";
  probationMonths?: number;
};

export type HireInvite = {
  token: string;
  tenantSlug: string;
  email: string;
  candidateName: string;
  status: HireInviteStatus;
  createdAt: string;
  expiresAt: string;
  inquiryId?: string;
  prefill: HireInvitePrefill;
  completedAt?: string;
  securityHint?: string;
  /** Snapshot of files submitted on public form */
  employeeFile?: EmployeeFileEntry[];
  hrPoliciesSignature?: string;
};

const invites: HireInvite[] = [
  {
    token: "demo-apply-2025",
    tenantSlug: "kinder-pilot",
    email: "candidate.demo@email.com",
    candidateName: "Demo Candidate",
    status: "pending",
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    prefill: {
      name: "Demo Candidate",
      email: "candidate.demo@email.com",
      phone: "+92 300 1112233",
      role: "teacher",
      branchId: "branch-nn",
      offeredSalary: 55000,
      employmentType: "full_time",
      probationMonths: 3,
    },
    securityHint: "This link was emailed to candidate.demo@email.com · valid 14 days",
  },
];

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `hire${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createHireInvite(input: {
  email: string;
  candidateName: string;
  tenantSlug?: string;
  inquiryId?: string;
  prefill?: HireInvitePrefill;
  expiresInDays?: number;
}): HireInvite {
  const expiresInDays = input.expiresInDays ?? 14;
  const invite: HireInvite = {
    token: randomToken(),
    tenantSlug: input.tenantSlug ?? "kinder-pilot",
    email: input.email.trim().toLowerCase(),
    candidateName: input.candidateName.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
    inquiryId: input.inquiryId,
    prefill: input.prefill ?? {},
    securityHint: `Secure hire invite for ${input.email.trim().toLowerCase()} · expires in ${expiresInDays} days`,
  };
  invites.unshift(invite);
  return invite;
}

export function getHireInvite(token: string): HireInvite | undefined {
  return invites.find((i) => i.token === token);
}

export function validateHireInvite(
  token: string
): { ok: true; invite: HireInvite } | { ok: false; reason: string } {
  const invite = getHireInvite(token);
  if (!invite) {
    return { ok: false, reason: "This hiring application link is invalid or was not found." };
  }
  if (token === "demo-apply-2025" && invite.status === "completed") {
    invite.status = "pending";
    invite.completedAt = undefined;
  }
  if (invite.status === "revoked") {
    return { ok: false, reason: "This hiring link has been revoked. Contact HR." };
  }
  if (invite.status === "completed") {
    return { ok: false, reason: "This hiring application was already submitted." };
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    invite.status = "expired";
    return { ok: false, reason: "This hiring link has expired. Ask HR for a new invite." };
  }
  return { ok: true, invite };
}

export function completeHireInvite(
  token: string,
  payload: {
    employeeFile: EmployeeFileEntry[];
    hrPoliciesSignature?: string;
    prefill?: Partial<HireInvitePrefill>;
  }
): boolean {
  const invite = getHireInvite(token);
  if (!invite || invite.status !== "pending") return false;
  invite.status = "completed";
  invite.completedAt = new Date().toISOString();
  invite.employeeFile = payload.employeeFile;
  invite.hrPoliciesSignature = payload.hrPoliciesSignature;
  if (payload.prefill) {
    invite.prefill = { ...invite.prefill, ...payload.prefill };
  }
  return true;
}

export function buildHireInviteUrl(token: string, tenantSlug?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qs = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : "";
  return `${origin}/apply/${token}${qs}`;
}

export function listHireInvites(): HireInvite[] {
  return [...invites];
}
