"use client";

import { useRouter } from "next/navigation";
import { StaffApplicationWizard } from "@/components/hr/employee-file/StaffApplicationWizard";
import type { HireInvite } from "@/lib/hire-invite-store";
import { publicApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import {
  employmentApplicationBody,
  roleLabel,
  summarizeJobApplication,
} from "@/lib/staff-inquiries-api";

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
        onPublicComplete={async ({ name, jobApplication }) => {
          // An invite from an offer belongs to a candidate already in Staff Inquiries —
          // the API has no update call, so only file applicants who are not there yet.
          if (!invite.inquiryId) {
            const role = invite.prefill.role ?? "teacher";
            try {
              await publicApi.post(
                "/forms/employment-application",
                employmentApplicationBody({
                  name,
                  email: jobApplication.email || invite.email,
                  phone: jobApplication.mobilePhone || invite.prefill.phone || "",
                  position: jobApplication.designation || roleLabel(role),
                  branchId: jobApplication.branchId || invite.prefill.branchId,
                  ...summarizeJobApplication(jobApplication),
                  tag: "online",
                  notes: "Submitted via secure apply link",
                })
              );
            } catch (e) {
              throw new Error(apiErrorMessage(e, "Could not submit your application. Please try again."));
            }
          }
          router.push(
            `/apply/${invite.token}/thanks?name=${encodeURIComponent(name.split(" ")[0] || "there")}`
          );
        }}
      />
    </div>
  );
}
