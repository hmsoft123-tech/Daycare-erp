import {
  devFallbackTenant,
  resolveTenant,
  unsealToken,
} from "@kinder-pilot/api-client/server";
import { validateHireInvite, type HireInvite, type HireInvitePrefill } from "@/lib/hire-invite-store";

/** Server-only: signed `/apply/<token>` hire invites (see /api/hr/hire-invites). */
export const HIRE_INVITE_PURPOSE = "hire-invite";

export type SignedHireInvite = {
  tenantId: string;
  email: string;
  candidateName: string;
  /** Staff inquiry the offer came from — the candidate is already in the pipeline */
  inquiryId?: string;
  createdAt: string;
  prefill: HireInvitePrefill;
};

/**
 * Signed tokens are checked for signature, expiry and school (a link minted on
 * schoola.… does not open on schoolb.…). Anything else falls back to the demo store.
 */
export async function resolveHireInvite(
  token: string,
  host: string | null
): Promise<{ ok: true; invite: HireInvite } | { ok: false; reason: string }> {
  if (!token.includes(".")) return validateHireInvite(token);

  const signed = await unsealToken<SignedHireInvite>(HIRE_INVITE_PURPOSE, token);
  if (!signed) {
    return { ok: false, reason: "This hiring link is invalid or has expired. Ask HR for a new invite." };
  }
  const tenant = (await resolveTenant(host)) ?? devFallbackTenant(host);
  if (!tenant || tenant.tenantId !== signed.data.tenantId) {
    return { ok: false, reason: "This hiring link belongs to a different school." };
  }

  const { data, exp } = signed;
  const expiresAt = new Date(exp * 1000);
  return {
    ok: true,
    invite: {
      token,
      tenantSlug: data.tenantId,
      email: data.email,
      candidateName: data.candidateName,
      status: "pending",
      createdAt: data.createdAt,
      expiresAt: expiresAt.toISOString(),
      inquiryId: data.inquiryId,
      prefill: data.prefill,
      securityHint: `Secure hire invite for ${data.email} · valid until ${expiresAt.toLocaleDateString("en-GB")}`,
    },
  };
}
