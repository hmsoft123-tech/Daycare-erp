"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Lock, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnrollmentFeeModal } from "./EnrollmentFeeModal";
import { RejectFeesModal } from "./RejectFeesModal";
import { useCan } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import {
  apiErrorMessage,
  feeDiscountLabel,
  feeValuesFrom,
  type ApiFeeApprovalTicket,
  type ApiFeeLock,
} from "@/lib/admissions-api";
import { CYCLE_SUFFIX } from "@/lib/fees-api";
import { useTenantStore } from "@/lib/tenant-store";
import { branchLabel, useBranches, useBranchQueryValues } from "@/lib/hooks/use-branches";
import { formatCurrency, formatDate } from "@/lib/utils";

type Level = "branch" | "company";

/** Sends no `status`, so the backend returns its default queue. */
const DEFAULT_QUEUE = "__queue";

/** `status` query values for each queue. */
const STATUS_OPTIONS: Record<Level, { value: string; label: string }[]> = {
  branch: [
    { value: "PENDING_BRANCH_APPROVAL", label: "Waiting for branch approval" },
    { value: "BRANCH_APPROVED", label: "Branch approved" },
    { value: "HO_APPROVED", label: "Company approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "ALL", label: "All" },
  ],
  company: [
    { value: DEFAULT_QUEUE, label: "Waiting for company approval" },
    { value: "HO_APPROVED", label: "Company approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "ALL", label: "All" },
  ],
};

const CONFIG = {
  branch: {
    endpoint: "/admissions/fee-approvals/tickets",
    empty: "No fee proposals are waiting for branch approval.",
    rejectLabel: "rejected by the branch",
  },
  company: {
    endpoint: "/admissions/head-office/fee-locks",
    empty: "No branch-approved fees are waiting for company approval.",
    rejectLabel: "rejected by the company (Head Office)",
  },
} as const;

/** `branch-reject-fees` (3b) and `ho-reject-fees` (3c) both send the inquiry back to TOUR_SCHEDULED. */
const rejectPath = (level: Level, inquiryId: number, reason: string) =>
  `/admissions/inquiries/${inquiryId}/${level === "branch" ? "branch" : "ho"}-reject-fees?rejectionReason=${encodeURIComponent(reason)}`;

const ALL_BRANCHES = "__all";

function statusBadge(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  if (s.includes("HO_APPROVED") || s.includes("LOCK")) return <Badge variant="success">Company approved</Badge>;
  if (s.includes("BRANCH_APPROVED")) return <Badge variant="info">Branch approved</Badge>;
  if (s.includes("PENDING")) return <Badge variant="warning">Pending branch</Badge>;
  if (s.includes("REJECT")) return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="secondary">{s ? s.replace(/_/g, " ").toLowerCase() : "—"}</Badge>;
}

function awaitsLevel(ticket: ApiFeeApprovalTicket, level: Level): boolean {
  const status = (ticket.approvalStatus ?? "").toUpperCase();
  const stage = (ticket.pipelineStage ?? "").toUpperCase();
  const branchPending = status === "PENDING_BRANCH_APPROVAL" || stage === "PENDING_BRANCH_FEE_APPROVAL";
  if (level === "branch") return branchPending;
  // The company approves only what the branch has already approved.
  return (
    !branchPending &&
    status !== "REJECTED" &&
    !ticket.hoApprovedAt &&
    status !== "HO_APPROVED" &&
    stage !== "ENROLLED_UNPAID" &&
    stage !== "ENROLLED"
  );
}

/**
 * Fee approval queue. Branch level: `GET /admissions/fee-approvals/tickets` +
 * `branch-approve-fees` (3b). Company level: `GET /admissions/head-office/fee-locks`
 * + `lock-fees` (3c), which moves the card to Enrolled Unpaid, issues the challan
 * and emails the parent the enrollment / payment link. Either level can reject
 * (`branch-reject-fees` / `ho-reject-fees`), which sends the inquiry back to Tour Scheduled.
 */
export function FeeApprovalQueue({ level }: { level: Level }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const { branches } = useBranches();
  const canAct = useCan(level === "branch" ? "fees.branchApprove" : "fees.companyApprove");

  const [status, setStatus] = useState(STATUS_OPTIONS[level][0].value);
  const [branchId, setBranchId] = useState(ALL_BRANCHES);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [locking, setLocking] = useState<ApiFeeApprovalTicket | null>(null);
  const [rejecting, setRejecting] = useState<ApiFeeApprovalTicket | null>(null);
  // Stable per ticket so the fee form is not reset while it is being edited.
  const lockingValues = useMemo(() => (locking ? feeValuesFrom(locking) : undefined), [locking]);

  const branchValues = useBranchQueryValues(branchId === ALL_BRANCHES ? null : branchId);
  const queryKey = ["fee-approvals", level, tenantId, status, branchValues?.join(",") ?? ""];
  const ticketsPath = (branch?: string) => {
    const params = new URLSearchParams();
    if (status !== DEFAULT_QUEUE) params.set("status", status);
    if (branch) params.set("branchId", branch);
    return `${CONFIG[level].endpoint}?${params.toString()}`;
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const lists = await Promise.all(
        (branchValues ?? [undefined]).map((b) => api.get<ApiFeeApprovalTicket[]>(ticketsPath(b)))
      );
      const byLock = new Map(lists.flat().map((t) => [`${t.inquiryId}-${t.feeLockId ?? ""}`, t]));
      return [...byLock.values()];
    },
  });
  const tickets = data ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["fee-approvals"] });
    void queryClient.invalidateQueries({ queryKey: ["admissions", tenantId] });
  };

  const branchApprove = async (ticket: ApiFeeApprovalTicket) => {
    setBusyId(ticket.inquiryId);
    try {
      await api.post(`/admissions/inquiries/${ticket.inquiryId}/branch-approve-fees`);
      toast.success(`${ticket.childName ?? "Inquiry"} — fees approved, sent for company approval`);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not approve the fees."));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (reason: string) => {
    const ticket = rejecting;
    if (!ticket) return;
    setBusyId(ticket.inquiryId);
    try {
      await api.post(rejectPath(level, ticket.inquiryId, reason));
      toast.success(`${ticket.childName ?? "Inquiry"} — fees rejected, moved back to Tour Scheduled`);
      setRejecting(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not reject the fees."));
    } finally {
      setBusyId(null);
    }
  };

  // `lock-fees` takes no body: the backend locks the package exactly as proposed and branch-approved.
  const companyApprove = async () => {
    const ticket = locking;
    if (!ticket) return;
    setLocking(null);
    setBusyId(ticket.inquiryId);
    try {
      const r = await api.post<ApiFeeLock>(`/admissions/inquiries/${ticket.inquiryId}/lock-fees`);
      toast.success(
        `Fees approved & locked${r.challanNumber ? ` — challan ${r.challanNumber}` : ""}. ${
          r.emailSent ? "Enrollment form & payment link emailed to the parent." : "Moved to Enrolled Unpaid."
        }`
      );
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not approve and lock the fees."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS[level].map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {branches.length > 1 && (
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.code} value={b.code}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading approvals…
        </div>
      ) : isError ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
          <p className="text-sm font-medium text-danger">
            {apiErrorMessage(error, "Could not load the approval queue.")}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted">{CONFIG[level].empty}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => {
            const pending = awaitsLevel(t, level);
            const busy = busyId === t.inquiryId;
            const discount = feeDiscountLabel(t, formatCurrency) ?? "No discount";
            const lines = [...(t.lineItems ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const optedIds = (t.optedServiceIds ?? "").split(",").map((id) => id.trim());
            return (
              <Card key={`${t.inquiryId}-${t.feeLockId ?? ""}`}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-[220px] flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admissions/${t.inquiryId}`}
                        className="font-semibold text-heading hover:text-brand-600"
                      >
                        {t.childName?.trim() || "Unnamed child"}
                      </Link>
                      {statusBadge(t.approvalStatus)}
                    </div>
                    <p className="text-xs text-muted">
                      {t.parentName || "—"}
                      {t.parentPhone ? ` · ${t.parentPhone}` : ""} · {t.gradeOrProgram || "—"} ·{" "}
                      {branchLabel(branches, t.branchId)}
                    </p>
                    <p className="text-xs text-muted">
                      Proposed by {t.proposedBy || "—"}
                      {t.proposedAt ? ` · ${formatDate(t.proposedAt, "dd MMM yyyy")}` : ""}
                      {t.branchApprovedBy ? ` · branch approved by ${t.branchApprovedBy}` : ""}
                      {t.hoApprovedBy ? ` · company approved by ${t.hoApprovedBy}` : ""}
                    </p>
                    {t.feeNotes && <p className="text-xs italic text-muted">“{t.feeNotes}”</p>}
                  </div>
                  <dl className="grid min-w-[220px] grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {lines.length > 0 ? (
                      lines.map((line, i) => (
                        <Fragment key={`${line.feeStructureId ?? "line"}-${i}`}>
                          <dt className="text-muted">
                            {line.lineDescription ?? line.feeName ?? line.serviceType}
                            <span className="text-[10px]">{CYCLE_SUFFIX[line.billingCycle ?? ""] ?? ""}</span>
                            {line.feeStructureId != null && optedIds.includes(String(line.feeStructureId)) && (
                              <span className="ml-1 rounded bg-brand-50 px-1 text-[10px] text-brand-700">add-on</span>
                            )}
                          </dt>
                          <dd className="text-right font-medium text-heading">
                            {formatCurrency(line.lineTotal ?? line.amount ?? 0)}
                          </dd>
                        </Fragment>
                      ))
                    ) : (
                      <>
                        <dt className="text-muted">Monthly tuition</dt>
                        <dd className="text-right font-medium text-heading">
                          {formatCurrency(t.monthlyTuition ?? 0)}
                        </dd>
                        <dt className="text-muted">Admission fee</dt>
                        <dd className="text-right font-medium text-heading">
                          {formatCurrency(t.admissionFee ?? 0)}
                        </dd>
                      </>
                    )}
                    <dt className="text-muted">
                      Discount
                      {t.appliedDiscountCodes && (
                        <span className="block font-mono text-[10px]">{t.appliedDiscountCodes}</span>
                      )}
                    </dt>
                    <dd className="text-right font-medium text-heading">{discount}</dd>
                    <dt className="font-semibold text-heading">Net amount</dt>
                    <dd className="text-right font-bold text-heading">{formatCurrency(t.netAmount ?? 0)}</dd>
                  </dl>
                  {canAct && pending && (
                    <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:flex-col">
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(t)}>
                        <XCircle className="h-4 w-4 text-danger" />
                        Reject
                      </Button>
                      {level === "branch" ? (
                        <Button size="sm" disabled={busy} onClick={() => void branchApprove(t)}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve fees
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busy} onClick={() => setLocking(t)}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                          Approve &amp; lock
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {level === "company" && (
        <EnrollmentFeeModal
          open={!!locking}
          card={locking ? { studentName: locking.childName?.trim() || "Unnamed child" } : null}
          targetStageLabel="Enrolled Unpaid"
          initialValues={lockingValues}
          confirmLabel="Approve & lock fees"
          readOnly
          onCancel={() => setLocking(null)}
          onConfirm={() => void companyApprove()}
        />
      )}

      <RejectFeesModal
        open={!!rejecting}
        childName={rejecting?.childName?.trim() || "Unnamed child"}
        levelLabel={CONFIG[level].rejectLabel}
        saving={!!rejecting && busyId === rejecting.inquiryId}
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => void reject(reason)}
      />
    </>
  );
}
