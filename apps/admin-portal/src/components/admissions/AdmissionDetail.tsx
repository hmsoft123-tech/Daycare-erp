"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, CheckCircle2, Copy, Loader2, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/components/security/Can";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkPaidModal } from "./MarkPaidModal";
import { EditMeetingModal } from "./EditMeetingModal";
import { useApiClient } from "@/lib/api";
import {
  apiErrorMessage,
  feeDiscountLabel,
  enrollmentFormUrl,
  feeApprovalBlocker,
  toAdmissionCard,
  type ApiInquiryDetail,
  type ApiInquiryMeeting,
  type ApiPaymentUrl,
  type MeetingUpdate,
  type ApiStudentConversion,
  type PaymentConfirmation,
} from "@/lib/admissions-api";
import { useTenantStore } from "@/lib/tenant-store";
import { formatCurrency, formatDate } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  website: "Website",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

const MEETING_LABELS: Record<string, string> = {
  CAMPUS_TOUR: "Campus tour",
  PARENT_INTERVIEW: "Parent interview",
  ASSESSMENT: "Assessment",
};

const FEE_STAGES = new Set(["PENDING_BRANCH_FEE_APPROVAL", "BRANCH_FEE_APPROVED", "HO_FEE_LOCK"]);

function label(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ").toLowerCase() : "—";
}

/** Inquiry detail from `GET /admissions/inquiries/{id}` (meetings, fees and challan included). */
export function AdmissionDetail({ id }: { id: string }) {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const queryClient = useQueryClient();
  const canBranchApprove = useCan("fees.branchApprove");
  const canCompanyApprove = useCan("fees.companyApprove");
  const canConfirmPayment = useCan("payments.confirm");
  const [approving, setApproving] = useState(false);
  const [resending, setResending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const canEditMeetings = useCan("admissions.update");
  const [editingMeeting, setEditingMeeting] = useState<ApiInquiryMeeting | null>(null);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const queryKey = ["admission", tenantId, id];

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiInquiryDetail>(`/admissions/inquiries/${encodeURIComponent(id)}`),
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
  const childName = data.childName?.trim() || "Unnamed child";
  const unpaid = data.stage === "ENROLLED_UNPAID";
  const formUrl = data.enrollmentToken
    ? enrollmentFormUrl(data.enrollmentToken)
    : data.enrollmentWizardUrl ?? null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["admissions", tenantId] });
    void queryClient.invalidateQueries({ queryKey: ["fee-approvals"] });
  };

  // Stage 3b: a branch admin approves the fee package the branch staff proposed.
  const approveFees = async () => {
    setApproving(true);
    try {
      await api.post(`/admissions/inquiries/${encodeURIComponent(id)}/branch-approve-fees`);
      toast.success("Fees approved — sent to the company for the final approval");
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not approve the fees."));
    } finally {
      setApproving(false);
    }
  };

  // Re-sends the enrollment form / payment link email to the parent.
  const resendLink = async () => {
    setResending(true);
    try {
      const r = await api.post<ApiPaymentUrl>(
        `/admissions/inquiries/${encodeURIComponent(id)}/generate-payment-url?resendEmail=true`
      );
      toast.success(
        r.emailSent
          ? `Enrollment form link emailed to ${data.parentEmail || "the parent"}`
          : r.message || "Link generated — the email could not be sent"
      );
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not send the enrollment link."));
    } finally {
      setResending(false);
    }
  };

  const markPaid = async (payment: PaymentConfirmation) => {
    setPaying(true);
    try {
      const identifier = data.challanNumber || id;
      const r = await api.post<ApiStudentConversion>(
        `/admissions/enrollments/${encodeURIComponent(identifier)}/mark-paid`,
        payment
      );
      toast.success(r.message || `Payment confirmed — student ${r.studentCode ?? r.studentId} is enrolled`);
      setMarkingPaid(false);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not mark the fee as paid."));
    } finally {
      setPaying(false);
    }
  };

  const saveMeeting = async (update: MeetingUpdate) => {
    if (!editingMeeting) return;
    setSavingMeeting(true);
    try {
      await api.put(
        `/admissions/inquiries/${encodeURIComponent(id)}/meetings/${editingMeeting.id}`,
        update
      );
      toast.success("Meeting updated");
      setEditingMeeting(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the meeting."));
    } finally {
      setSavingMeeting(false);
    }
  };

  const copyLink = async () => {
    if (!formUrl) return;
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stageLabel = label(admission?.stage ?? data.stage);
  const hasFees = data.monthlyTuition != null || data.admissionFee != null || data.netAmount != null;
  const meetings = data.meetings ?? [];

  return (
    <>
      <PageHeader title={childName} subtitle={`Admission inquiry · ${data.gradeOrProgram ?? "—"}`} />
      <div className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Card>
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

            {meetings.length > 0 && (
              <div className="space-y-2 border-t border-[#F1F3F5] pt-4">
                <h3 className="text-sm font-semibold text-heading">Meetings</h3>
                <ul className="space-y-2 text-sm">
                  {meetings.map((m) => (
                    <li key={m.id} className="rounded-xl bg-bg px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-heading">
                          {MEETING_LABELS[m.meetingType ?? ""] ?? label(m.meetingType)} ·{" "}
                          {m.scheduledDate ?? "—"}
                          {m.scheduledTime ? ` · ${m.scheduledTime.slice(0, 5)}` : ""}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {label(m.status)}
                          </Badge>
                          {canEditMeetings && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setEditingMeeting(m)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                        </span>
                      </div>
                      {m.locationOrClassroom && <p className="text-xs text-muted">{m.locationOrClassroom}</p>}
                      {m.notes && <p className="text-xs text-muted">{m.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {data.stage === "PENDING_BRANCH_FEE_APPROVAL" && canBranchApprove && (
                <Button type="button" onClick={() => void approveFees()} disabled={approving}>
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Branch approve fees
                </Button>
              )}
              {(data.stage === "BRANCH_FEE_APPROVED" || data.stage === "HO_FEE_LOCK") && canCompanyApprove && (
                <Button asChild>
                  <Link href="/admissions/company-fee-approvals">Open company fee approval</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/admissions">← Back to pipeline</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {hasFees && (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-heading">Fees</h3>
                  {data.feeApprovalStatus && (
                    <Badge variant="info" className="capitalize">
                      {label(data.feeApprovalStatus)}
                    </Badge>
                  )}
                </div>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted">Monthly tuition</dt>
                    <dd className="font-medium">{formatCurrency(data.monthlyTuition ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Admission fee</dt>
                    <dd className="font-medium">{formatCurrency(data.admissionFee ?? 0)}</dd>
                  </div>
                  {feeDiscountLabel(data, formatCurrency) && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Discount</dt>
                      <dd className="font-medium">{feeDiscountLabel(data, formatCurrency)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#F1F3F5] pt-1 font-semibold text-heading">
                    <dt>Net amount</dt>
                    <dd>{formatCurrency(data.netAmount ?? 0)}</dd>
                  </div>
                </dl>
                {data.feeNotes && <p className="text-xs italic text-muted">“{data.feeNotes}”</p>}
                {FEE_STAGES.has(data.stage) && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {feeApprovalBlocker(data.stage)}
                  </p>
                )}
                {data.challanNumber && (
                  <dl className="space-y-1 border-t border-[#F1F3F5] pt-2">
                    <div className="flex justify-between">
                      <dt className="text-muted">Challan</dt>
                      <dd className="font-medium">{data.challanNumber}</dd>
                    </div>
                    {data.challanDueDate && (
                      <div className="flex justify-between">
                        <dt className="text-muted">Due date</dt>
                        <dd className="font-medium">{data.challanDueDate}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted">Status</dt>
                      <dd className="font-medium capitalize">{label(data.challanStatus)}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>
          )}

          {unpaid && (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm">
                <h3 className="flex items-center gap-2 font-semibold text-heading">
                  <Mail className="h-4 w-4 text-brand-500" />
                  Enrollment form for the parent
                </h3>
                <p className="text-xs text-muted">
                  Fees are approved and locked. The parent completes the enrollment form and pays the
                  challan from this link — it was emailed to {data.parentEmail || "the parent"}.
                </p>
                {formUrl ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-bg px-3 py-2 text-xs text-heading ring-1 ring-[#DFE3E8]">
                      {formUrl}
                    </code>
                    <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted">No link yet — send it to generate one.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resending}
                    onClick={() => void resendLink()}
                  >
                    {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {formUrl ? "Resend email" : "Send link"}
                  </Button>
                  {canConfirmPayment && (
                    <Button type="button" size="sm" onClick={() => setMarkingPaid(true)}>
                      <BadgeCheck className="h-4 w-4" />
                      Mark as paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditMeetingModal
        meeting={editingMeeting}
        saving={savingMeeting}
        onCancel={() => setEditingMeeting(null)}
        onSave={(update) => void saveMeeting(update)}
      />

      <MarkPaidModal
        open={markingPaid}
        studentName={childName}
        challanNumber={data.challanNumber ?? undefined}
        amountDue={data.netAmount ?? undefined}
        saving={paying}
        onCancel={() => setMarkingPaid(false)}
        onConfirm={(payment) => void markPaid(payment)}
      />
    </>
  );
}
