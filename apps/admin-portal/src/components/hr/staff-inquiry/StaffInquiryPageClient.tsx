"use client";

import { useState } from "react";
import { StaffInquiryBoard } from "@/components/hr/staff-inquiry/StaffInquiryBoard";
import { AddStaffInquiryModal } from "@/components/hr/staff-inquiry/AddStaffInquiryModal";
import { PublicInquiryLinkBanner } from "@/components/admissions/PublicInquiryLinkBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { StaffInquiryCard } from "@/types";
import { UserPlus } from "lucide-react";

export function StaffInquiryPageClient({ initial }: { initial: StaffInquiryCard[] }) {
  const [items, setItems] = useState(initial);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Staff Inquiries"
        subtitle="Hiring pipeline — inquiry → interview → offer → hired"
      >
        <Button type="button" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Inquiry
        </Button>
      </PageHeader>
      <PublicInquiryLinkBanner
        title="Public employment inquiry link"
        description="Candidates open this link, choose Employment, and land in Staff Inquiries — same flow as admissions."
        inquiryType="employment"
      />
      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
        <p className="font-semibold">Secure hire application (employee file)</p>
        <p className="mt-1 text-xs text-brand-800/90">
          From Offer / Hire, create an apply link — candidates only see hiring-time documents.
          Admin staff profile shows the full SDLC employee file (a–x); post-probation fields unlock after probation.
          Demo:{" "}
          <a className="font-mono underline" href="/apply/demo-apply-2025">
            /apply/demo-apply-2025
          </a>
        </p>
      </div>
      <StaffInquiryBoard inquiries={items} />
      <AddStaffInquiryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(card) => setItems((prev) => [card, ...prev])}
      />
    </>
  );
}
