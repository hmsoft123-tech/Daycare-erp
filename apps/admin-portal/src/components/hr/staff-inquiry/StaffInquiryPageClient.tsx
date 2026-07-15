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
      <StaffInquiryBoard inquiries={items} />
      <AddStaffInquiryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(card) => setItems((prev) => [card, ...prev])}
      />
    </>
  );
}
