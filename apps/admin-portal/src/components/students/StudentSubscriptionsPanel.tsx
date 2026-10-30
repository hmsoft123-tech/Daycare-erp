"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pause, Play, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalPortal } from "@/components/ui/modal-portal";
import { useCan } from "@/components/security/Can";
import { useApiClient } from "@/lib/api";
import { apiErrorMessage, type ApiAdditionalService } from "@/lib/admissions-api";
import { CYCLE_SUFFIX, serviceTypeLabel } from "@/lib/fees-api";
import { useCompanyCode } from "@/lib/hooks/use-company-code";
import {
  subscriptionsPath,
  type AddSubscription,
  type ApiSubscription,
  type SubscriptionStatus,
} from "@/lib/students-api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; variant: "success" | "warning" | "secondary" | "info" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  PENDING: { label: "Pending", variant: "info" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

type Action = { kind: "pause" | "resume" | "cancel"; sub: ApiSubscription };

const ACTION_COPY = {
  pause: { title: "Pause", body: "Monthly challans skip this service while it is paused.", button: "Pause service" },
  resume: { title: "Resume", body: "The service is billed again from the next challan.", button: "Resume service" },
  cancel: {
    title: "Cancel",
    body: "The subscription is ended and no longer billed. It stays in the history; subscribe again to restart it.",
    button: "Cancel subscription",
  },
} as const;

type Props = { studentId: string; branchCode: string; program: string };

/**
 * Monthly services an enrolled student is billed for (tuition and add-ons): `GET/POST
 * /fees/students/{id}/subscriptions` (+ `/bulk`), `PATCH …/pause` / `…/resume`
 * and `DELETE` (cancel). Prices always come from the fee structure.
 */
export function StudentSubscriptionsPanel({ studentId, branchCode, program }: Props) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const canManage = useCan("fees.subscriptions");
  const { companyCode } = useCompanyCode();

  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);

  const queryKey = ["student-subscriptions", studentId];
  const subsQuery = useQuery({
    queryKey,
    queryFn: () => api.get<ApiSubscription[]>(subscriptionsPath(studentId)),
  });
  const subs = subsQuery.data ?? [];

  const scope = new URLSearchParams({ companyCode });
  if (branchCode) scope.set("branchCode", branchCode);
  if (program && program !== "—") scope.set("gradeOrProgram", program);
  const servicesQuery = useQuery({
    queryKey: ["fee-addons", companyCode, branchCode, program],
    queryFn: () => api.get<ApiAdditionalService[]>(`/fees/structures/additional-services?${scope}`),
    enabled: adding && !!companyCode,
    staleTime: 5 * 60_000,
  });
  // A service the student already has (and has not cancelled) cannot be added twice.
  const taken = new Set(subs.filter((s) => s.status !== "CANCELLED").map((s) => s.feeStructureId));
  const available = (servicesQuery.data ?? []).filter((s) => !taken.has(s.id));

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["student-balance", studentId] });
  };

  const openAdd = () => {
    setPicked([]);
    setStartDate("");
    setNotes("");
    setAdding(true);
  };

  const add = async () => {
    if (!picked.length || busy) return;
    setBusy(true);
    const items: AddSubscription[] = picked.map((feeStructureId) => ({
      feeStructureId,
      startDate: startDate || undefined,
      notes: notes.trim() || undefined,
    }));
    try {
      if (items.length === 1) await api.post<ApiSubscription>(subscriptionsPath(studentId), items[0]);
      else await api.post<ApiSubscription[]>(`${subscriptionsPath(studentId)}/bulk`, { subscriptions: items });
      toast.success(items.length === 1 ? "Service subscribed" : `${items.length} services subscribed`);
      setAdding(false);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not add the services."));
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (!action || busy) return;
    setBusy(true);
    const path = `${subscriptionsPath(studentId)}/${action.sub.id}`;
    try {
      const r =
        action.kind === "cancel"
          ? await api.delete<ApiSubscription>(path)
          : await api.patch<ApiSubscription>(`${path}/${action.kind}`);
      const status = r?.status ? STATUS_BADGE[r.status]?.label.toLowerCase() : null;
      toast.success(`${action.sub.serviceName ?? "Service"}${status ? ` is now ${status}` : " updated"}`);
      setAction(null);
      refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the subscription."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-heading">Services &amp; subscriptions</h3>
            <p className="text-xs text-muted">Tuition and add-on services billed on the monthly challan, at the fee-structure price.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void subsQuery.refetch()} disabled={subsQuery.isFetching}>
              <RefreshCw className={cn("h-4 w-4", subsQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canManage && (
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add service
              </Button>
            )}
          </div>
        </div>

        {subsQuery.isPending ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading subscriptions…
          </p>
        ) : subsQuery.isError ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-danger">{apiErrorMessage(subsQuery.error, "Could not load subscriptions.")}</span>
            <Button variant="outline" size="sm" onClick={() => void subsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : subs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No services yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Service</th>
                  <th className="py-2 pr-4 text-right font-semibold">Price</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Dates</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {subs.map((s) => {
                  const badge = STATUS_BADGE[s.status ?? "PENDING"] ?? STATUS_BADGE.PENDING;
                  return (
                    <tr key={s.id} className={s.status === "CANCELLED" ? "opacity-60" : undefined}>
                      <td className="py-2 pr-4">
                        <p className="font-medium text-heading">{s.serviceName || "—"}</p>
                        <p className="text-[11px] text-muted">
                          {serviceTypeLabel(s.serviceType)}
                          {s.notes ? ` · ${s.notes}` : ""}
                          {s.addedBy ? ` · added by ${s.addedBy}` : ""}
                        </p>
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {formatCurrency(s.effectivePrice ?? 0)}
                        <span className="text-xs text-muted">{CYCLE_SUFFIX[s.billingCycle ?? ""] ?? ""}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted">
                        {s.startDate ? `From ${formatDate(s.startDate)}` : "—"}
                        {s.endDate ? ` · until ${formatDate(s.endDate)}` : ""}
                      </td>
                      <td className="py-2">
                        {canManage && s.status !== "CANCELLED" && (
                          <div className="flex justify-end gap-1">
                            {s.status === "ACTIVE" && (
                              <Button size="sm" variant="ghost" aria-label={`Pause ${s.serviceName ?? "service"}`} onClick={() => setAction({ kind: "pause", sub: s })}>
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {s.status === "PAUSED" && (
                              <Button size="sm" variant="ghost" aria-label={`Resume ${s.serviceName ?? "service"}`} onClick={() => setAction({ kind: "resume", sub: s })}>
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" aria-label={`Cancel ${s.serviceName ?? "service"}`} onClick={() => setAction({ kind: "cancel", sub: s })}>
                              <X className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <ModalPortal open={adding} onClose={busy ? () => {} : () => setAdding(false)} closeOnBackdrop={!busy}>
        <div className="border-b border-[#F1F3F5] px-6 py-5">
          <h2 className="font-heading text-lg font-bold text-heading">Add services</h2>
          <p className="mt-1 text-sm text-muted">Prices come from the fee structure for this branch and program.</p>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {servicesQuery.isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading services…
            </p>
          ) : servicesQuery.isError ? (
            <p className="text-sm text-danger">{apiErrorMessage(servicesQuery.error, "Could not load services.")}</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted">
              No other optional services are set up for this program. An admin adds them under Finance → Fee Structures.
            </p>
          ) : (
            <div className="grid gap-2">
              {available.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                    picked.includes(s.id) ? "border-brand-500 bg-brand-50" : "border-[#DFE3E8]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={picked.includes(s.id)}
                      onCheckedChange={() =>
                        setPicked((l) => (l.includes(s.id) ? l.filter((x) => x !== s.id) : [...l, s.id]))
                      }
                    />
                    {s.feeName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatCurrency(s.baseAmount ?? 0)}
                    {CYCLE_SUFFIX[s.billingCycle ?? ""] ?? ""}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="subStart">Start date</Label>
              <Input id="subStart" type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <p className="mt-1 text-[11px] text-muted">Leave empty to start today.</p>
            </div>
          </div>
          <div>
            <Label htmlFor="subNotes">Notes</Label>
            <Textarea
              id="subNotes"
              className="mt-1"
              rows={2}
              maxLength={300}
              placeholder="e.g. route number, batch timing"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
          <Button variant="outline" disabled={busy} onClick={() => setAdding(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !picked.length} onClick={() => void add()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Subscribe {picked.length > 1 ? `${picked.length} services` : ""}
          </Button>
        </div>
      </ModalPortal>

      <ModalPortal open={!!action} onClose={busy ? () => {} : () => setAction(null)} closeOnBackdrop={!busy}>
        {action && (
          <>
            <div className="space-y-2 px-6 py-5">
              <h2 className="font-heading text-lg font-bold text-heading">
                {ACTION_COPY[action.kind].title} {action.sub.serviceName ?? "this service"}?
              </h2>
              <p className="text-sm text-muted">{ACTION_COPY[action.kind].body}</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#F1F3F5] bg-bg/40 px-6 py-4">
              <Button variant="outline" disabled={busy} onClick={() => setAction(null)}>
                Back
              </Button>
              <Button variant={action.kind === "cancel" ? "destructive" : "default"} disabled={busy} onClick={() => void run()}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {ACTION_COPY[action.kind].button}
              </Button>
            </div>
          </>
        )}
      </ModalPortal>
    </Card>
  );
}
