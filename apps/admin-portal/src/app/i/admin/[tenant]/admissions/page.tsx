import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanBoard } from "@/components/admissions/KanbanBoard";
import { PublicInquiryLinkBanner } from "@/components/admissions/PublicInquiryLinkBanner";
import { getAdmissions } from "@/lib/mock-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdmissionsPage() {
  const admissions = await getAdmissions();

  return (
    <>
      <PageHeader
        title="Admissions Pipeline"
        subtitle="Drag cards between stages to update inquiry status"
        action={{ label: "New Enrollment", href: "/admissions/new" }}
      />
      <PublicInquiryLinkBanner />
      <KanbanBoard admissions={admissions} />
      <div className="mt-4 text-center">
        <Button variant="link" asChild>
          <Link href="/admissions/new">Start enrollment wizard →</Link>
        </Button>
      </div>
    </>
  );
}
