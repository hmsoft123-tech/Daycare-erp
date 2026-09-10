import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InquiryFollowUpPanel } from "@/components/admissions/InquiryFollowUpPanel";
import { getAdmissionById } from "@/lib/mock-service";
import { branches } from "@/data/branches";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  website: "Website",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

export default async function AdmissionDetailPage({ params }: Props) {
  const { id } = await params;
  const admission = await getAdmissionById(id);
  if (!admission) notFound();

  const branch = branches.find((b) => b.id === admission.branchId);

  return (
    <>
      <PageHeader
        title={admission.studentName}
        subtitle={`Admission inquiry · ${admission.program}`}
      />
      <div className="grid max-w-4xl gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              {admission.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={admission.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              )}
              <div>
                <Badge className="capitalize">{admission.stage.replace(/_/g, " ")}</Badge>
                <p className="mt-1 text-sm text-muted">{admission.daysInStage} days in current stage</p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Parent name</dt>
                <dd className="font-medium text-heading">{admission.parentName}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact</dt>
                <dd className="font-medium text-heading">{admission.parentPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">CNIC</dt>
                <dd className="font-medium text-heading">{admission.parentCnic ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Date of inquiry</dt>
                <dd className="font-medium text-heading">
                  {formatDate(admission.createdAt)} · {admission.inquiryTime}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Platform / source</dt>
                <dd className="font-medium text-heading">
                  {admission.inquirySource ? SOURCE_LABELS[admission.inquirySource] : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Child DOB / age</dt>
                <dd className="font-medium text-heading">
                  {admission.childDob ?? "—"} · {admission.age} yrs
                </dd>
              </div>
              <div>
                <dt className="text-muted">Interested program</dt>
                <dd className="font-medium text-heading">{admission.program}</dd>
              </div>
              <div>
                <dt className="text-muted">Branch</dt>
                <dd className="font-medium text-heading">{branch?.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Inquiry status</dt>
                <dd className="font-medium capitalize text-heading">{admission.stage.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-muted">Follow-up status</dt>
                <dd className="font-medium capitalize text-heading">
                  {admission.followUpStatus?.replace(/_/g, " ") ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Notes</dt>
                <dd className="mt-0.5 font-medium text-heading">{admission.description}</dd>
              </div>
            </dl>
            <Button asChild variant="outline">
              <Link href="/admissions">← Back to pipeline</Link>
            </Button>
          </CardContent>
        </Card>
        <InquiryFollowUpPanel
          initialStatus={admission.followUpStatus}
          initialOutcome={admission.followUpOutcome}
          initialNotes={admission.followUpNotes}
        />
      </div>
    </>
  );
}
