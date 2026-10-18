import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  getCookie,
  jsonError,
  rejectCrossSite,
  sealToken,
  unsealSession,
} from "@kinder-pilot/api-client/server";
import { HIRE_INVITE_PURPOSE, type SignedHireInvite } from "@/lib/hire-invite-server";
import type { StaffRole } from "@/types";

const ROLES = new Set<StaffRole>(["admin", "teacher", "therapist", "accountant", "support", "executive"]);
const EMPLOYMENT = new Set(["full_time", "part_time", "contract"]);

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v && v.length <= max ? v : undefined;
}

function num(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

/**
 * POST — HR mints a secure `/apply/<token>` link for a candidate. The API has no
 * invite endpoint, so the token itself carries the invite, signed with the
 * session secret and bound to this school's tenant.
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const session = await unsealSession(getCookie(request, SESSION_COOKIE));
  if (!session) return jsonError(401, "Not signed in");

  let input: Record<string, unknown> = {};
  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      input = parsed as Record<string, unknown>;
    }
  } catch {
    /* empty body → validation error below */
  }
  const prefill = (input.prefill && typeof input.prefill === "object" ? input.prefill : {}) as Record<
    string,
    unknown
  >;

  const email = str(input.email, 254)?.toLowerCase();
  const candidateName = str(input.candidateName, 120);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !candidateName) {
    return jsonError(400, "Candidate name and a valid email are required.");
  }
  const expiresInDays = num(input.expiresInDays, 1, 30) ?? 14;
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86_400;
  const role = str(prefill.role, 20) as StaffRole | undefined;
  const employmentType = str(prefill.employmentType, 20);

  const invite: SignedHireInvite = {
    tenantId: session.tenantId,
    email,
    candidateName,
    inquiryId: str(input.inquiryId, 40),
    createdAt: new Date().toISOString(),
    prefill: {
      name: str(prefill.name, 120) ?? candidateName,
      email,
      phone: str(prefill.phone, 40),
      role: role && ROLES.has(role) ? role : undefined,
      branchId: str(prefill.branchId, 64),
      offeredSalary: num(prefill.offeredSalary, 0, 10_000_000),
      joiningDate: str(prefill.joiningDate, 10),
      employmentType:
        employmentType && EMPLOYMENT.has(employmentType)
          ? (employmentType as SignedHireInvite["prefill"]["employmentType"])
          : undefined,
      probationMonths: num(prefill.probationMonths, 0, 24),
    },
  };

  const token = await sealToken(HIRE_INVITE_PURPOSE, invite, exp);
  return NextResponse.json(
    { token, expiresAt: new Date(exp * 1000).toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
