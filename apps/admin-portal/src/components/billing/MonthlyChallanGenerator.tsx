"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarRange, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/admissions-api";
import { branchLabel, useBranches } from "@/lib/hooks/use-branches";
import { useCompanyCode } from "@/lib/hooks/use-company-code";
import { formatCurrency, formatDate } from "@/lib/utils";

/** `GenerateMonthlyChallanResponse` */
type ApiChallanRun = {
  billingMonth?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  challansGenerated?: number | null;
  challansSkipped?: number | null;
  studentsProcessed?: number | null;
  totalAmountBilled?: number | null;
  totalCreditApplied?: number | null;
  details?:
    | {
        studentId?: number | null;
        studentCode?: string | null;
        challanNumber?: string | null;
        grossAmount?: number | null;
        creditApplied?: number | null;
        netAmount?: number | null;
        status?: string | null;
        message?: string | null;
      }[]
    | null;
};

const ALL_BRANCHES = "__all";

const thisMonth = () => new Date().toISOString().slice(0, 7);

function statusBadge(status: string | null | undefined, net: number | null | undefined) {
  const s = (status ?? "").toUpperCase();
  // A challan fully covered by credit comes back GENERATED with nothing to pay.
  if (s === "PAID" || ((s === "GENERATED" || s === "UNPAID") && net === 0)) {
    return <Badge variant="success">Covered by credit</Badge>;
  }
  if (s === "UNPAID" || s === "GENERATED" || s === "PENDING") return <Badge variant="warning">Unpaid</Badge>;
  if (s.includes("SKIP")) return <Badge variant="secondary">Skipped</Badge>;
  if (s.includes("ERROR") || s.includes("FAIL")) return <Badge variant="danger">Failed</Badge>;
  return <Badge variant="secondary">{s ? s.replace(/_/g, " ").toLowerCase() : "—"}</Badge>;
}

/**
 * `POST /fees/challans/generate-monthly` — one challan per student for the month,
 * covering their ACTIVE monthly service subscriptions, less available credit when
 * `applyBalanceCredit` is on. The backend skips students who already have a challan
 * for that month. Every figure shown comes from the server's response.
 */
export function MonthlyChallanGenerator() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { companyCode, resolved, isLoading: companyLoading } = useCompanyCode();
  const { branches } = useBranches();

  const [branch, setBranch] = useState(ALL_BRANCHES);
  const [month, setMonth] = useState(thisMonth());
  const [dueDate, setDueDate] = useState("");
  const [applyCredit, setApplyCredit] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApiChallanRun | null>(null);

  const branchName = branch === ALL_BRANCHES ? "all branches" : branchLabel(branches, branch);

  const review = () => {
    const next: Record<string, string> = {};
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) next.month = "Pick the billing month";
    if (dueDate && dueDate < `${month}-01`) next.dueDate = "Due date is before the billing month";
    setErrors(next);
    if (!Object.keys(next).length) setConfirming(true);
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    try {
      const r = await api.post<ApiChallanRun>("/fees/challans/generate-monthly", {
        companyId: companyCode,
        branchId: branch === ALL_BRANCHES ? undefined : branch,
        billingMonth: month,
        dueDate: dueDate || undefined,
        applyBalanceCredit: applyCredit,
      });
      setResult(r);
      setConfirming(false);
      toast.success(
        `${r?.challansGenerated ?? 0} challan(s) generated, ${r?.challansSkipped ?? 0} skipped for ${r?.billingMonth ?? month}`
      );
      // Credit may have been applied to student balances.
      void queryClient.invalidateQueries({ queryKey: ["student-balance"] });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not generate the challans."));
      setConfirming(false);
    } finally {
      setRunning(false);
    }
  };

  const details = result?.details ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-heading">
              <CalendarRange className="h-4 w-4 text-brand-500" />
              Generate monthly challans
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="challanMonth">Billing month</Label>
                <Input id="challanMonth" type="month" className="mt-1" value={month} onChange={(e) => setMonth(e.target.value)} />
                {errors.month && <p className="mt-1 text-xs text-danger">{errors.month}</p>}
              </div>
              <div>
                <Label>Branch</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="mt-1">
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
              </div>
              <div>
                <Label htmlFor="challanDue">Due date (optional)</Label>
                <Input id="challanDue" type="date" className="mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <p className="mt-1 text-[11px] text-muted">Empty = last day of the billing month.</p>
                {errors.dueDate && <p className="mt-1 text-xs text-danger">{errors.dueDate}</p>}
              </div>
              <label className="flex items-center gap-2 self-center text-sm text-heading">
                <Switch checked={applyCredit} onCheckedChange={setApplyCredit} />
                Deduct students&apos; credit balance
              </label>
            </div>
            {!companyLoading && !resolved && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Your school could not be identified — sign in again before generating challans.
              </p>
            )}
            <Button onClick={review} disabled={running || companyLoading || !companyCode}>
              Review &amp; generate
            </Button>
          </div>

          <div className="rounded-2xl bg-bg p-4 text-xs text-muted">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-heading">
              <Info className="h-4 w-4 text-brand-500" />
              What the server does
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>One challan per student, covering their <strong>active monthly service subscriptions</strong>.</li>
              <li>Paused or cancelled services are not billed.</li>
              <li>With credit deduction on, available credit is subtracted and recorded in the student&apos;s ledger.</li>
              <li>Students who already have a challan for the month are skipped, so running it twice is safe.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-heading">
                Results · {result.billingMonth ?? month}
                {result.branchId ? ` · ${branchLabel(branches, result.branchId)}` : ""}
              </h3>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Students processed", String(result.studentsProcessed ?? 0)],
                ["Generated", String(result.challansGenerated ?? 0)],
                ["Skipped", String(result.challansSkipped ?? 0)],
                ["Total billed (net)", formatCurrency(result.totalAmountBilled ?? 0)],
                ["Credit applied", formatCurrency(result.totalCreditApplied ?? 0)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-bg p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="font-heading text-lg font-bold text-heading">{value}</dd>
                </div>
              ))}
            </dl>
            {details.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                No students had active monthly subscriptions to bill for this month.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Student</th>
                      <th className="py-2 pr-4 font-semibold">Challan</th>
                      <th className="py-2 pr-4 text-right font-semibold">Gross</th>
                      <th className="py-2 pr-4 text-right font-semibold">Credit applied</th>
                      <th className="py-2 pr-4 text-right font-semibold">Net payable</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {details.map((d, i) => (
                      <tr key={`${d.studentId ?? i}-${d.challanNumber ?? i}`}>
                        <td className="py-2 pr-4">
                          {d.studentId != null ? (
                            <Link href={`/students/${d.studentId}`} className="font-medium text-brand-600 hover:underline">
                              {d.studentCode || `#${d.studentId}`}
                            </Link>
                          ) : (
                            d.studentCode || "—"
                          )}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{d.challanNumber || "—"}</td>
                        <td className="py-2 pr-4 text-right">{d.grossAmount != null ? formatCurrency(d.grossAmount) : "—"}</td>
                        <td className="py-2 pr-4 text-right text-emerald-700">
                          {(d.creditApplied ?? 0) > 0 ? `−${formatCurrency(d.creditApplied ?? 0)}` : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold text-heading">{d.netAmount != null ? formatCurrency(d.netAmount) : "—"}</td>
                        <td className="py-2 pr-4">{statusBadge(d.status, d.netAmount)}</td>
                        <td className="py-2 text-xs text-muted">{d.message || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ModalPortal open={confirming} onClose={running ? () => {} : () => setConfirming(false)} closeOnBackdrop={!running}>
        <div className="space-y-2 px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">Generate challans for {month}?</h2>
          <p className="text-sm text-muted">
            For {branchName}, due {dueDate ? formatDate(dueDate) : "on the last day of the month"}
            {applyCredit ? ", deducting available credit balances" : ", without using credit balances"}.
          </p>
          <p className="text-sm text-muted">Challans are issued to parents and cannot be undone from here.</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button variant="outline" disabled={running} onClick={() => setConfirming(false)}>
            Back
          </Button>
          <Button disabled={running} onClick={() => void run()}>
            {running && <Loader2 className="h-4 w-4 animate-spin" />}
            {running ? "Generating…" : "Generate challans"}
          </Button>
        </div>
      </ModalPortal>
    </div>
  );
}
