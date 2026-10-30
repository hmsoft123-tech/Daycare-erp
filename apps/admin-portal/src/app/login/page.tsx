import type { Metadata } from "next";
import { headers } from "next/headers";
import { devFallbackTenant, resolveTenant } from "@kinder-pilot/api-client/server";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Kinder Pilot",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Step 1–3 of the auth flow: URL → domain → tenant resolve (server-side).
 * The form never sends a tenant ID; the login route derives it from the Host again.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; token?: string }>;
}) {
  const host = (await headers()).get("host");
  const [tenant, { next, token }] = await Promise.all([
    resolveTenant(host),
    searchParams,
  ]);

  const schoolName = (tenant ?? devFallbackTenant(host))?.companyName ?? null;

  return <LoginForm schoolName={schoolName} next={next} resetToken={token} />;
}
