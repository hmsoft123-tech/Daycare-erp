"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/components/security/Can";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage, toAdmissionCard, type ApiInquiry } from "@/lib/admissions-api";
import { useTenantStore } from "@/lib/tenant-store";
import { formatDate } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  website: "Website",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

/** Inquiry detail from `GET /admissions/inquiries/{id}`. */
export function AdmissionDetail({ id }: { id: string }) {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const queryClient = useQueryClient();
  const canBranchApprove = useCan("fees.branchApprove");
  const [approving, setApproving] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admission", tenantId, id],
    queryFn: () => api.get<ApiInquiry>(`/admissions/inquiries/${encodeURIComponent(id)}`),
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading inquiry…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-danger">
          {apiErrorMessage(error, "Could not load this inquiry.")}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/admissions">← Back to pipeline</Link>
          </Button>
        </div>
      </div>
    );
  }

  const admission = toAdmissionCard(data);

  // Stage 3b: a branch admin approves the fee package the branch staff proposed.
  const approveFees = async () => {
    setApproving(true);
    try {
      await api.post(`/admissions/inquiries/${encodeURIComponent(id)}/branch-approve-fees`);
      toast.success("Fees approved — sent to Head Office for the final lock");
      void queryClient.invalidateQueries({ queryKey: ["admission", tenantId, id] });
      void queryClient.invalidateQueries({ queryKey: ["admissions", tenantId] });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not approve the fees."));
    } finally {
      setApproving(false);
    }
  };
  const stageLabel = (admission?.stage ?? data.stage).replace(/_/g, " ").toLowerCase();

  return (
    <>
      <PageHeader
        title={data.childName?.trim() || "Unnamed child"}
        subtitle={`Admission inquiry · ${data.gradeOrProgram ?? "—"}`}
      />
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div>
            <Badge className="capitalize">{stageLabel}</Badge>
            {admission && (
              <p className="mt-1 text-sm text-muted">{admission.daysInStage} days since last update</p>
            )}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Parent name</dt>
              <dd className="font-medium text-heading">{data.parentName || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Contact</dt>
              <dd className="font-medium text-heading">{data.parentPhone || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-heading">{data.parentEmail || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Date of inquiry</dt>
              <dd className="font-medium text-heading">
                {data.createdAt ? formatDate(data.createdAt, "dd MMM yyyy · HH:mm") : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Platform / source</dt>
              <dd className="font-medium text-heading">
                {admission?.inquirySource ? SOURCE_LABELS[admission.inquirySource] : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Child DOB / age</dt>
              <dd className="font-medium text-heading">
                {data.childDob ?? "—"}
                {admission ? ` · ${admission.age} yrs` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Interested program</dt>
              <dd className="font-medium text-heading">{data.gradeOrProgram ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Branch</dt>
              <dd className="font-medium text-heading">{data.branchId ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Notes</dt>
              <dd className="mt-0.5 font-medium text-heading">{data.notes || "—"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {data.stage === "PENDING_BRANCH_FEE_APPROVAL" && canBranchApprove && (
              <Button type="button" onClick={() => void approveFees()} disabled={approving}>
                {approving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Branch approve fees
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/admissions">← Back to pipeline</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
