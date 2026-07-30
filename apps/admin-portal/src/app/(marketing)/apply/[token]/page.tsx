import { validateHireInvite } from "@/lib/hire-invite-store";
import { PublicStaffApplicationClient } from "@/components/hr/employee-file/PublicStaffApplicationClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Secure Staff Application | Kinder Pilot",
  description: "Complete your hiring employee file via a secure invite link.",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicApplyPage({ params }: Props) {
  const { token } = await params;
  const result = validateHireInvite(token);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-soft-red text-danger">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-heading">Link not available</h1>
        <p className="mt-3 text-sm text-muted">{result.reason}</p>
        <Button asChild className="mt-8" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
        <p className="mt-6 text-[11px] text-muted">
          Demo token: <code className="rounded bg-bg px-1">demo-apply-2025</code>
        </p>
      </div>
    );
  }

  return <PublicStaffApplicationClient invite={result.invite} />;
}
