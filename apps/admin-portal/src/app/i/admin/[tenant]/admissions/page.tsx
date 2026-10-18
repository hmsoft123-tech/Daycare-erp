import { PageHeader } from "@/components/layout/PageHeader";
import { AdmissionsPipeline } from "@/components/admissions/AdmissionsPipeline";
import { PublicInquiryLinkBanner } from "@/components/admissions/PublicInquiryLinkBanner";
import { PublicEnrollmentInviteBanner } from "@/components/admissions/PublicEnrollmentInviteBanner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/security/Can";

export default function AdmissionsPage() {
  return (
    <>
      <PageHeader
        title="Admissions Pipeline"
        subtitle="Drag cards between stages to update inquiry status"
      >
        <Can capability="admissions.update">
          <Button asChild>
            <Link href="/admissions/new">New Enrollment</Link>
          </Button>
        </Can>
      </PageHeader>
      <PublicInquiryLinkBanner />
      <PublicEnrollmentInviteBanner />
      <AdmissionsPipeline />
      <Can capability="admissions.update">
        <div className="mt-4 text-center">
          <Button variant="link" asChild>
            <Link href="/admissions/new">Start enrollment wizard →</Link>
          </Button>
        </div>
      </Can>
    </>
  );
}
