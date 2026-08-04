/**
 * Mock enrollment invite tokens — replace with Laravel API:
 * POST /api/enrollment-invites  → { token, emailLink }
 * GET  /api/enrollment-invites/:token  → validate + prefill
 */

export type EnrollmentInviteStatus = "pending" | "completed" | "expired" | "revoked";

export type EnrollmentInvitePrefill = {
  childFullName?: string;
  fatherName?: string;
  fatherEmail?: string;
  fatherPhone?: string;
  motherName?: string;
  motherEmail?: string;
  motherPhone?: string;
  branchId?: string;
  /** @deprecated use servicePlanId */
  mainProgram?: string;
  /** plan-{classGroup}-{tier} from services catalogue */
  servicePlanId?: string;
  classGroup?: string;
  careTier?: "base" | "lite" | "plus" | "pro";
};

export type EnrollmentInvite = {
  token: string;
  tenantSlug: string;
  email: string;
  parentName: string;
  status: EnrollmentInviteStatus;
  createdAt: string;
  expiresAt: string;
  /** Optional link to admissions CRM card */
  admissionId?: string;
  prefill: EnrollmentInvitePrefill;
  completedAt?: string;
  /** Company-specific validation hint (mock) */
  securityHint?: string;
};

const invites: EnrollmentInvite[] = [
  {
    token: "demo-enroll-2025",
    tenantSlug: "kinder-pilot",
    email: "parent.demo@email.com",
    parentName: "Demo Parent",
    status: "pending",
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    prefill: {
      childFullName: "Ayaan Demo",
      fatherName: "Demo Parent",
      fatherEmail: "parent.demo@email.com",
      fatherPhone: "+92 300 0000000",
      branchId: "branch-nn",
    },
    securityHint: "This link was emailed to parent.demo@email.com · valid 14 days",
  },
];

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `enr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createEnrollmentInvite(input: {
  email: string;
  parentName: string;
  tenantSlug?: string;
  admissionId?: string;
  prefill?: EnrollmentInvitePrefill;
  /** Days until expiry (default 14) */
  expiresInDays?: number;
}): EnrollmentInvite {
  const expiresInDays = input.expiresInDays ?? 14;
  const invite: EnrollmentInvite = {
    token: randomToken(),
    tenantSlug: input.tenantSlug ?? "kinder-pilot",
    email: input.email.trim().toLowerCase(),
    parentName: input.parentName.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
    admissionId: input.admissionId,
    prefill: input.prefill ?? {},
    securityHint: `Secure invite for ${input.email.trim().toLowerCase()} · expires in ${expiresInDays} days`,
  };
  invites.unshift(invite);
  return invite;
}

export function getEnrollmentInvite(token: string): EnrollmentInvite | undefined {
  return invites.find((i) => i.token === token);
}

export function validateEnrollmentInvite(
  token: string
): { ok: true; invite: EnrollmentInvite } | { ok: false; reason: string } {
  const invite = getEnrollmentInvite(token);
  if (!invite) {
    return { ok: false, reason: "This enrollment link is invalid or was not found." };
  }
  // Keep demo token reusable for local QA
  if (token === "demo-enroll-2025" && invite.status === "completed") {
    invite.status = "pending";
    invite.completedAt = undefined;
  }
  if (invite.status === "revoked") {
    return { ok: false, reason: "This enrollment link has been revoked. Contact the school." };
  }
  if (invite.status === "completed") {
    return { ok: false, reason: "This enrollment form was already submitted." };
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    invite.status = "expired";
    return { ok: false, reason: "This enrollment link has expired. Ask the school for a new invite." };
  }
  return { ok: true, invite };
}

export function completeEnrollmentInvite(token: string): boolean {
  const invite = getEnrollmentInvite(token);
  if (!invite || invite.status !== "pending") return false;
  invite.status = "completed";
  invite.completedAt = new Date().toISOString();
  return true;
}

export function buildEnrollmentInviteUrl(token: string, tenantSlug?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qs = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : "";
  return `${origin}/enroll/${token}${qs}`;
}

export function listEnrollmentInvites(): EnrollmentInvite[] {
  return [...invites];
}
