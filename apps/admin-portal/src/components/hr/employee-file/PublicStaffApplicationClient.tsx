"use client";

import { useRouter } from "next/navigation";
import { StaffApplicationWizard } from "@/components/hr/employee-file/StaffApplicationWizard";
import type { HireInvite } from "@/lib/hire-invite-store";

type Props = {
  invite: HireInvite;
  schoolName?: string;
};

export function PublicStaffApplicationClient({
  invite,
  schoolName = "Dr. Sofia’s Daycare",
}: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">{schoolName}</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-heading">Employee Application Form</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Hello{invite.candidateName ? `, ${invite.candidateName}` : ""} — complete the SDLC job application
          (personal, education, experience, skills, references, questions, and hiring documents).
        </p>
        {invite.securityHint && (
          <p className="mx-auto mt-2 max-w-xl rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            {invite.securityHint}
          </p>
        )}
      </div>

      <StaffApplicationWizard
        mode="public"
        inviteToken={invite.token}
        schoolName={schoolName}
        prefill={invite.prefill}
        onPublicComplete={({ name }) => {
          router.push(
            `/apply/${invite.token}/thanks?name=${encodeURIComponent(name.split(" ")[0] || "there")}`
          );
        }}
      />
    </div>
  );
}
