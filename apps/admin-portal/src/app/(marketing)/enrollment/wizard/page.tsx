import { notFound, redirect } from "next/navigation";

/**
 * The fee-lock email links parents to `/enrollment/wizard?token=…`; the form lives at
 * `/enroll/{token}`, which validates the token itself.
 */
export default async function EnrollmentWizardLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value || !/^[A-Za-z0-9_-]{8,128}$/.test(value)) notFound();
  redirect(`/enroll/${value}`);
}
