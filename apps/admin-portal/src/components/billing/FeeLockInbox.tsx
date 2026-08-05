"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useUIStore } from "@/lib/store";
import { decideFeeLockRequest } from "@/lib/mock-service";
import { FEE_LOCK_STATUS_BADGE, FEE_LOCK_STATUS_LABEL } from "@/lib/fee-lock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { branches } from "@/data/branches";
import type { FeeLockRequest } from "@/types";
import { Lock, Check, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  requests: FeeLockRequest[];
};

export function FeeLockInbox({ requests: initial }: Props) {
  const branchId = useBranchFilter();
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";
  const [items, setItems] = useState(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending_ho" | "all">("pending_ho");

  const filtered = useMemo(() => {
    let list = branchId ? items.filter((r) => r.branchId === branchId) : items;
    if (filter === "pending_ho") list = list.filter((r) => r.status === "pending_ho");
    return list;
  }, [items, branchId, filter]);

  const decide = async (req: FeeLockRequest, decision: "approved" | "rejected") => {
    if (!isHeadOffice) {
      toast.error("Only Head Office can approve fee locks");
      return;
    }
    const result = await decideFeeLockRequest(req.id, decision, {
      decidedBy: "Head Office",
      hoNotes: notes[req.id]?.trim() || undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.map((r) => (r.id === req.id ? result.request : r)));
    toast.success(
      decision === "approved"
        ? `${req.studentName} is now pending payment — parent portal fee-locked`
        : `Fee lock rejected for ${req.studentName}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {isHeadOffice
            ? "Approve fee packages before students become pending payment (parent feed locked until paid)."
            : "Branch fee-lock requests wait for Head Office. Students stay current until HO approves."}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={filter === "pending_ho" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending_ho")}
          >
            Pending HO
          </Button>
          <Button
            type="button"
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#DFE3E8] px-4 py-10 text-center text-sm text-muted">
          No fee-lock requests in this view.
        </p>
      )}

      {filtered.map((req) => {
        const branch = branches.find((b) => b.id === req.branchId);
        const total = req.monthlyTuition + req.admissionFee;
        return (
          <Card key={req.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <Lock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-heading">{req.studentName}</h3>
                      <Badge variant={FEE_LOCK_STATUS_BADGE[req.status]}>
                        {FEE_LOCK_STATUS_LABEL[req.status]}
                      </Badge>
                      <Badge variant="secondary">{req.source}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {branch?.name ?? req.branchId} · requested {formatDate(req.requestedAt.slice(0, 10))} by{" "}
                      {req.requestedBy}
                    </p>
                    {req.feeNotes && <p className="mt-2 text-sm text-heading">{req.feeNotes}</p>}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted">Monthly + admission</p>
                  <p className="font-heading text-lg font-bold text-heading">{formatCurrency(total)}</p>
                  <p className="text-xs text-muted">
                    Tuition {formatCurrency(req.monthlyTuition)} · Admission{" "}
                    {formatCurrency(req.admissionFee)}
                  </p>
                </div>
              </div>

              {req.status === "pending_ho" && isHeadOffice && (
                <div className="space-y-3 border-t border-[#F1F3F5] pt-4">
                  <div>
                    <Label htmlFor={`ho-${req.id}`}>HO notes (optional)</Label>
                    <Textarea
                      id={`ho-${req.id}`}
                      className="mt-1"
                      rows={2}
                      value={notes[req.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                      placeholder="Approval conditions or reject reason"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => decide(req, "approved")}>
                      <Check className="h-4 w-4" />
                      Approve fee lock → pending
                    </Button>
                    <Button type="button" variant="outline" onClick={() => decide(req, "rejected")}>
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {req.status !== "pending_ho" && (
                <p className="border-t border-[#F1F3F5] pt-3 text-xs text-muted">
                  {req.status === "approved" ? "Approved" : "Rejected"}
                  {req.decidedBy ? ` by ${req.decidedBy}` : ""}
                  {req.invoiceNumber ? ` · ${req.invoiceNumber}` : ""}
                  {req.hoNotes ? ` — ${req.hoNotes}` : ""}
                </p>
              )}

              {!isHeadOffice && req.status === "pending_ho" && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Waiting for Head Office. Student will not become pending until approved.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
