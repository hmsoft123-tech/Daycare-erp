import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdmissionById } from "@/lib/mock-service";
import { branches } from "@/data/branches";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

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
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            {admission.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={admission.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <div>
              <Badge className="capitalize">{admission.stage.replace(/_/g, " ")}</Badge>
              <p className="mt-1 text-sm text-gray-500">{admission.daysInStage} days in current stage</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Age</dt><dd className="font-medium">{admission.age} years</dd></div>
            <div><dt className="text-gray-500">Parent</dt><dd className="font-medium">{admission.parentName}</dd></div>
            <div><dt className="text-gray-500">Branch</dt><dd className="font-medium">{branch?.name}</dd></div>
            <div><dt className="text-gray-500">Created</dt><dd className="font-medium">{formatDate(admission.createdAt)}</dd></div>
          </dl>
          <Button asChild variant="outline">
            <Link href="/admissions">← Back to pipeline</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
