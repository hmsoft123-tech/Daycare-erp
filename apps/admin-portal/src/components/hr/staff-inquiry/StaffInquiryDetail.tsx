"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage, type ApiInquiry } from "@/lib/admissions-api";
import { toStaffInquiryCard } from "@/lib/staff-inquiries-api";
import { applyHiringOverlay, useStaffHiringStore } from "@/lib/staff-hiring-store";
import { useTenantStore } from "@/lib/tenant-store";
import { branches } from "@/data/branches";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Candidate detail from `GET /admissions/inquiries/{id}` (employment applications only). */
export function StaffInquiryDetail({ id }: { id: string }) {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const hiring = useStaffHiringStore((s) => s.byTenant[tenantId]);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admission", tenantId, id],
    queryFn: () => api.get<ApiInquiry>(`/admissions/inquiries/${encodeURIComponent(id)}`),
  });

  const back = (
    <Button asChild variant="outline">
      <Link href="/hr/inquiries">← Back to pipeline</Link>
    </Button>
  );

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading candidate…
      </div>
    );
  }

  const mapped = data ? toStaffInquiryCard(data) : null;
  const inquiry = mapped ? applyHiringOverlay([mapped], hiring)[0] : null;

  if (isError || !inquiry) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-danger">
          {isError
            ? apiErrorMessage(error, "Could not load this candidate.")
            : "This inquiry is not a staff application."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {isError && (
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          )}
          {back}
        </div>
      </div>
    );
  }

  const branch = branches.find((b) => b.id === inquiry.branchId);

  return (
    <>
      <PageHeader title={inquiry.name} subtitle={`Staff inquiry · ${inquiry.position || inquiry.role}`} />
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div>
            <Badge className="capitalize">{inquiry.stage.replace(/_/g, " ")}</Badge>
            <p className="mt-1 text-sm text-muted">{inquiry.daysInStage} days in current stage</p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Tag</dt>
              <dd className="font-medium capitalize">{inquiry.tag.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Position applied</dt>
              <dd className="font-medium">{inquiry.position || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{inquiry.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">{inquiry.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Experience</dt>
              <dd className="font-medium">{inquiry.experienceYears} years</dd>
            </div>
            <div>
              <dt className="text-muted">Qualification</dt>
              <dd className="font-medium">{inquiry.qualification ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Branch</dt>
              <dd className="font-medium">{branch?.name ?? (inquiry.branchId || "—")}</dd>
            </div>
            <div>
              <dt className="text-muted">Inquiry time</dt>
              <dd className="font-medium">
                {inquiry.createdAt ? formatDate(inquiry.createdAt) : "—"} · {inquiry.inquiryTime}
              </dd>
            </div>
            {inquiry.offeredSalary != null && (
              <div>
                <dt className="text-muted">Offered salary</dt>
                <dd className="font-medium">{formatCurrency(inquiry.offeredSalary)} / mo</dd>
              </div>
            )}
            {inquiry.joiningDate && (
              <div>
                <dt className="text-muted">Joining date</dt>
                <dd className="font-medium">{formatDate(inquiry.joiningDate)}</dd>
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
                  {inquiry.interviewDate} {inquiry.interviewTime}
                  {inquiry.interviewLocation ? ` · ${inquiry.interviewLocation}` : ""}
                </dd>
              </div>
            )}
          </dl>
          {back}
        </CardContent>
      </Card>
    </>
  );
}
