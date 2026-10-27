"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn, STAGES } from "./KanbanBoard";
import { ScheduleMeetingModal, type ScheduleMeetingValues } from "./ScheduleMeetingModal";
import { ProposeFeesModal } from "./ProposeFeesModal";
import { MarkPaidModal } from "./MarkPaidModal";
import { StageNoticeModal, type StageNotice } from "./StageNoticeModal";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api";
import {
  apiErrorMessage,
  feeApprovalBlocker,
  kanbanToCards,
  proposeFeesBody,
  scheduleTourBody,
  type ApiKanbanBoard,
  type ApiStudentConversion,
  type FeeSelection,
  type PaymentConfirmation,
} from "@/lib/admissions-api";
import { queryKeys } from "@/lib/query-client";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useTenantStore } from "@/lib/tenant-store";
import type { AdmissionStage } from "@/types";
import { cn } from "@/lib/utils";
import { useAccess } from "@/components/security/Can";
import type { Capability } from "@/lib/rbac";

type PendingMove = { kind: "schedule" | "fees" | "paid"; cardId: string };

/**
 * Admissions Kanban backed by the KinderPilot API: the board is
 * `GET /admissions/kanban` and each drag calls the endpoint for that transition.
 * Fees are proposed here (3a); branch (3b) and company (3c) approval happen in
 * their own queues, and the company lock is what moves a card to Enrolled Unpaid.
 */
export function AdmissionsPipeline() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const access = useAccess();
  const readOnly = !(
    access("admissions.update") ||
    access("admissions.waitlist") ||
    access("fees.propose") ||
    access("payments.confirm")
  );

  /** False (with a toast) when the role cannot run this step. */
  const allowed = (capability: Capability, action: string) => {
    if (access(capability)) return true;
    toast.error(`Your role cannot ${action}`);
    return false;
  };
  // Branch picked in the top switcher (its code); Head Office sees every branch.
  const branchId = useBranchFilter() ?? null;
  const queryKey = queryKeys.admissions(tenantId, branchId);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      api.get<ApiKanbanBoard>(
        branchId ? `/admissions/kanban?branchId=${encodeURIComponent(branchId)}` : "/admissions/kanban"
      ),
  });
  const items = useMemo(() => (data ? kanbanToCards(data) : []), [data]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<StageNotice | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /** Runs one write, then reloads the board so it shows what the backend stored. */
  const run = async <T,>(call: () => Promise<T>, success: (result: T) => string) => {
    setSaving(true);
    try {
      toast.success(success(await call()));
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the inquiry."));
      return false;
    } finally {
      setSaving(false);
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const to = over.id as AdmissionStage;
    if (!STAGES.some((s) => s.id === to)) return;

    const card = items.find((i) => i.id === active.id);
    if (!card || card.stage === to) return;

    switch (to) {
      case "meeting_test_scheduled":
        if (!allowed("admissions.update", "schedule tours or meetings")) return;
        setPending({ kind: "schedule", cardId: card.id });
        return;
      case "pending_ho_fee":
        if (!allowed("fees.propose", "propose fees")) return;
        setPending({ kind: "fees", cardId: card.id });
        return;
      case "enrol_unpaid":
        // Only the company (Head Office) fee lock moves a card here.
        setNotice({
          title: "Approve the fees first",
          message: `${card.studentName} moves to Enrolled Unpaid automatically once the fees are approved by the branch and then by the company. ${feeApprovalBlocker(card.apiStage)}`,
        });
        return;
      case "waitlist":
        if (!allowed("admissions.waitlist", "move inquiries to the waitlist")) return;
        void run(
          () =>
            api.post("/admissions/waitlist", {
              inquiryId: Number(card.id),
              desiredClassroomOrGrade: card.program,
            }),
          () => "Moved to waitlist"
        );
        return;
      case "paid":
        if (card.stage !== "enrol_unpaid") {
          setNotice({
            title: "Fees not approved yet",
            message: `${card.studentName} can be enrolled only after the fees are approved by the branch and the company and the challan is paid. ${feeApprovalBlocker(card.apiStage)}`,
          });
          return;
        }
        if (!allowed("payments.confirm", "mark fees as paid")) return;
        setPending({ kind: "paid", cardId: card.id });
        return;
      default:
        toast.error("The API has no step that moves an inquiry back to this stage");
    }
  };

  const pendingCard = pending ? items.find((i) => i.id === pending.cardId) ?? null : null;

  const onScheduleConfirm = (values: ScheduleMeetingValues) => {
    if (!pending) return;
    const id = pending.cardId;
    setPending(null);
    void run(
      () => api.post(`/admissions/inquiries/${id}/schedule-tour`, scheduleTourBody(values)),
      () => "Tour / meeting scheduled"
    );
  };

  // Stage 3a: propose the fee package; the branch and company approval queues take it from there.
  const onFeeConfirm = (selection: FeeSelection) => {
    if (!pending) return;
    const id = pending.cardId;
    setPending(null);
    void run(
      () => api.post(`/admissions/inquiries/${id}/propose-fees`, proposeFeesBody(selection)),
      () => "Fees proposed — waiting for branch approval"
    );
  };

  // Enrolled Unpaid → Enrolled once the fee is confirmed as received.
  const onMarkPaid = async (payment: PaymentConfirmation) => {
    if (!pendingCard) return;
    const identifier = pendingCard.invoiceNumber ?? pendingCard.id;
    const ok = await run(
      () =>
        api.post<ApiStudentConversion>(
          `/admissions/enrollments/${encodeURIComponent(identifier)}/mark-paid`,
          payment
        ),
      (r) => r.message || `Payment confirmed — student ${r.studentCode ?? r.studentId} is enrolled`
    );
    if (ok) setPending(null);
  };

  const activeCard = activeId ? items.find((i) => i.id === activeId) : null;

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pipeline…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-medium text-danger">
          {apiErrorMessage(error, "Could not load the admissions pipeline.")}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-[72px] z-20 -mx-4 mb-4 border-b border-[#F1F3F5] bg-bg/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {readOnly ? "Pipeline stages · view only for your role" : "Pipeline stages · drag cards to advance"}
          {(isFetching || saving) && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border border-t-[3px] bg-surface px-3 py-2 shadow-sm",
                s.color
              )}
            >
              <span className="text-xs font-bold text-muted">{i + 1}</span>
              <span className="text-xs font-semibold text-heading">{s.label}</span>
              <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-bold text-muted">
                {items.filter((c) => c.stage === s.id).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              cards={items.filter((c) => c.stage === stage.id)}
            />
          ))}
        </div>
        <DragOverlay>{activeCard ? <KanbanCard card={activeCard} /> : null}</DragOverlay>
      </DndContext>

      <ScheduleMeetingModal
        open={pending?.kind === "schedule"}
        card={pending?.kind === "schedule" ? pendingCard : null}
        onCancel={() => setPending(null)}
        onConfirm={onScheduleConfirm}
      />

      <ProposeFeesModal
        open={pending?.kind === "fees"}
        card={pending?.kind === "fees" ? pendingCard : null}
        onCancel={() => setPending(null)}
        onConfirm={onFeeConfirm}
      />

      <MarkPaidModal
        open={pending?.kind === "paid" && !!pendingCard}
        studentName={pendingCard?.studentName ?? ""}
        challanNumber={pendingCard?.invoiceNumber}
        amountDue={pendingCard?.netAmount}
        saving={saving}
        onCancel={() => setPending(null)}
        onConfirm={(payment) => void onMarkPaid(payment)}
      />

      <StageNoticeModal notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}
