"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StaffApplicationWizard } from "@/components/hr/employee-file/StaffApplicationWizard";
import { IdCardPreviewModal } from "@/components/id-cards/IdCardPreviewModal";
import { Button } from "@/components/ui/button";
import { staff } from "@/data/staff";
import { addMonths, mergeEmployeeFile } from "@/lib/employee-file";
import { defaultShiftForRole, ROLE_BASE_SALARY } from "@/lib/salary-determination";
import { generateStaffCardNumber } from "@/lib/id-card";
import { issueStaffIdCard } from "@/lib/id-card-store";
import type { PortalIdCard, Staff } from "@/types";
import { toast } from "sonner";

/**
 * Admin-only hiring wizard — same idea as Enrollment Wizard for students.
 * Completes initial hire + employee file in the panel (no public apply link required).
 */
export function AdminHiringWizardClient() {
  const router = useRouter();
  const [issuedCard, setIssuedCard] = useState<PortalIdCard | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [hiredId, setHiredId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done && hiredId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-surface p-8 text-center shadow-card">
        <h2 className="font-heading text-xl font-bold text-heading">Hire completed</h2>
        <p className="mt-2 text-sm text-muted">
          Employee saved to the staff directory with hire-phase employee file and ID card.
          Post-probation annexes can be updated later on their profile.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => setCardOpen(true)} disabled={!issuedCard}>
            View ID card
          </Button>
          <Button asChild variant="outline">
            <Link href={`/hr/staff/${hiredId}`}>Open staff profile</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDone(false);
              setHiredId(null);
              setIssuedCard(null);
              setCardOpen(false);
            }}
          >
            Hire another
          </Button>
        </div>
        <IdCardPreviewModal
          open={cardOpen}
          card={issuedCard}
          onClose={() => setCardOpen(false)}
          title="Staff ID Card generated"
          subtitle="Employee saved from the Hiring Wizard."
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
        <p className="font-semibold">Manual hiring in admin</p>
        <p className="mt-1 text-xs text-brand-800/90">
          Use this when HR completes the initial hire in-person (walk-in / campus). Same multi-step
          flow as student Enrollment Wizard — all hire-phase employee file fields including HR annexes.
          For remote candidates, use Staff Inquiries → Offer → public apply link instead.
        </p>
      </div>

      <StaffApplicationWizard
        mode="admin"
        onAdminComplete={async ({ values, employeeFile, signature, jobApplication }) => {
          const joinDate = values.joiningDate || new Date().toISOString().slice(0, 10);
          const id = `st-hire-${Date.now()}`;
          const employeeId = `KP-${String(100 + staff.length).padStart(3, "0")}`;
          const cardNumber = generateStaffCardNumber(employeeId);
          const file = mergeEmployeeFile(employeeFile, {
            staff_id_card: {
              received: true,
              fileName: `${cardNumber}.pdf`,
              receivedAt: new Date().toISOString().slice(0, 10),
            },
          });

          const role = values.role ?? "teacher";
          const baseSalary = values.offeredSalary ?? ROLE_BASE_SALARY[role];
          const member: Staff = {
            id,
            name: values.name,
            role,
            branchId: values.branchId ?? "branch-nn",
            employeeId,
            joinDate,
            phone: values.phone,
            email: values.email,
            status: "active",
            idCardNumber: cardNumber,
            probationEndDate: addMonths(joinDate, values.probationMonths ?? 3),
            probationCompleted: false,
            employeeFile: file,
            jobApplication,
            hrPoliciesSignedAt: new Date().toISOString(),
            hrPoliciesSignature: signature,
            salary: {
              baseSalary,
              shift: defaultShiftForRole(role),
              educationLevel: jobApplication.education.find((e) => e.institute)?.level,
              yearsAtSdlc: 0,
              lines: [
                {
                  id: `sal-hold-${Date.now()}`,
                  label: "Initial salary security hold",
                  amount: -Math.min(5000, Math.round(baseSalary * 0.05)),
                  kind: "deduction",
                  active: true,
                  notes: "Gradual hold over 3–5 months · refunded on clearance",
                },
              ],
              policyAcknowledgedAt: new Date().toISOString(),
            },
          };

          staff.unshift(member);
          const idCard = await issueStaffIdCard(member.id);
          setIssuedCard(idCard);
          setHiredId(member.id);
          setDone(true);
          setCardOpen(true);
          toast.success(`Hired ${member.name} — ID card ${cardNumber}`);
          router.refresh();
        }}
      />
    </>
  );
}
