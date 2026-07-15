import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStaffInquiryById } from "@/lib/mock-service";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StaffInquiryDetailPage({ params }: Props) {
  const { id } = await params;
  const inquiry = await getStaffInquiryById(id);
  if (!inquiry) notFound();

  const branch = branches.find((b) => b.id === inquiry.branchId);

  return (
    <>
      <PageHeader
        title={inquiry.name}
        subtitle={`Staff inquiry · ${inquiry.role}`}
      />
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            {inquiry.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inquiry.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <div>
              <Badge className="capitalize">{inquiry.stage.replace(/_/g, " ")}</Badge>
              <p className="mt-1 text-sm text-muted">{inquiry.daysInStage} days in current stage</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Tag</dt>
              <dd className="font-medium capitalize">{inquiry.tag.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Role</dt>
              <dd className="font-medium capitalize">{inquiry.role}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{inquiry.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">{inquiry.phone}</dd>
            </div>
            <div>
              <dt className="text-muted">Experience</dt>
              <dd className="font-medium">{inquiry.experienceYears} years</dd>
            </div>
            <div>
              <dt className="text-muted">Branch</dt>
              <dd className="font-medium">{branch?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Inquiry time</dt>
              <dd className="font-medium">
                {formatDate(inquiry.createdAt)} · {inquiry.inquiryTime}
              </dd>
            </div>
            {inquiry.offeredSalary != null && (
              <div>
                <dt className="text-muted">Offered salary</dt>
                <dd className="font-medium">{formatCurrency(inquiry.offeredSalary)} / mo</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-muted">Description</dt>
              <dd className="mt-0.5 font-medium text-heading">{inquiry.description}</dd>
            </div>
            {inquiry.interviewDate && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Interview</dt>
                <dd className="mt-0.5 font-medium">
                  {inquiry.interviewDate} {inquiry.interviewTime} · {inquiry.interviewLocation}
                </dd>
              </div>
            )}
          </dl>
          <Button asChild variant="outline">
            <Link href="/hr/inquiries">← Back to pipeline</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
