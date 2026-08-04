"use client";

import { useRouter } from "next/navigation";
import { EnrollmentWizard } from "@/components/admissions/EnrollmentWizard";
import type { EnrollmentInvite } from "@/lib/enrollment-invite-store";

type Props = {
  invite: EnrollmentInvite;
  schoolName?: string;
};

export function PublicEnrollmentClient({ invite, schoolName = "Kinder Pilot" }: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">{schoolName}</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-heading">Enrollment form</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Hello{invite.parentName ? `, ${invite.parentName}` : ""} — complete this secure form to finish
          enrollment. Link expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          .
        </p>
        {invite.securityHint && (
          <p className="mx-auto mt-2 max-w-xl rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            {invite.securityHint}
          </p>
        )}
      </div>

      <EnrollmentWizard
        mode="public"
        inviteToken={invite.token}
        schoolName={schoolName}
        prefill={{
          childFullName: invite.prefill.childFullName ?? "",
          fatherName: invite.prefill.fatherName ?? "",
          fatherEmail: invite.prefill.fatherEmail ?? "",
          fatherPhone: invite.prefill.fatherPhone ?? "",
          motherName: invite.prefill.motherName ?? "",
          motherEmail: invite.prefill.motherEmail ?? "",
          motherPhone: invite.prefill.motherPhone ?? "",
          branchId: invite.prefill.branchId ?? "",
          classGroup: invite.prefill.classGroup ?? "",
          careTier: invite.prefill.careTier ?? "base",
          completionMode: "mark_enrolled",
        }}
        onPublicComplete={({ childName }) => {
          router.push(
            `/enroll/${invite.token}/thanks?name=${encodeURIComponent(childName.split(" ")[0] || "there")}`
          );
        }}
      />
    </div>
  );
}
