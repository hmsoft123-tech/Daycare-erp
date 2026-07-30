import { validateEnrollmentInvite } from "@/lib/enrollment-invite-store";
import { PublicEnrollmentClient } from "@/components/admissions/PublicEnrollmentClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Secure Enrollment | Kinder Pilot",
  description: "Complete your daycare enrollment via a secure invite link.",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicEnrollPage({ params }: Props) {
  const { token } = await params;
  const result = validateEnrollmentInvite(token);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-red text-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-heading">Link not available</h1>
        <p className="mt-3 text-sm text-muted">{result.reason}</p>
        <p className="mt-2 text-xs text-muted">
          Security is company-specific: tokens are unique, time-limited, and single-use. Contact your
          school for a new invite.
        </p>
        <Button asChild className="mt-8" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
        <p className="mt-6 text-[11px] text-muted">
          Demo token: <code className="rounded bg-bg px-1">demo-enroll-2025</code>
        </p>
      </div>
    );
  }

  return <PublicEnrollmentClient invite={result.invite} />;
}
