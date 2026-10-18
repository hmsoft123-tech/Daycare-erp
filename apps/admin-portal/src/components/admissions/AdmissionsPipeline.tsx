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
import { EnrollmentFeeModal, type EnrollmentFeeValues } from "./EnrollmentFeeModal";
import { EnrollmentInviteLinkModal } from "./EnrollmentInviteLinkModal";
import type { EnrollmentInvite } from "@/lib/enrollment-invite-store";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api";
import {
  apiErrorMessage,
  feesBody,
  kanbanToCards,
  scheduleTourBody,
  type ApiFeeLock,
  type ApiKanbanBoard,
  type ApiStudentConversion,
} from "@/lib/admissions-api";
import { queryKeys } from "@/lib/query-client";
import { useUIStore } from "@/lib/store";
import { useTenantStore } from "@/lib/tenant-store";
import type { AdmissionStage } from "@/types";
import { cn } from "@/lib/utils";
import { useAccess } from "@/components/security/Can";
import type { Capability } from "@/lib/rbac";

type PendingMove = { kind: "schedule" | "fees"; cardId: string };

/**
 * Admissions Kanban backed by the KinderPilot API: the board is
 * `GET /admissions/kanban` and each drag calls the endpoint for that transition.
 */
export function AdmissionsPipeline() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const isHeadOffice = useUIStore((s) => s.contextType) === "head_office";
  const access = useAccess();
  const canPropose = access("fees.propose");
  const canLock = access("fees.lock");
  // Head Office context locks; a role that can only lock (Accountant) locks from anywhere.
  const locksFees = canLock && (isHeadOffice || !canPropose);
  const readOnly = !(
    access("admissions.update") ||
    access("admissions.waitlist") ||
    canPropose ||
    canLock ||
    access("payments.confirm")
  );

  /** False (with a toast) when the role cannot run this step. */
  const allowed = (capability: Capability, action: string) => {
    if (access(capability)) return true;
    toast.error(`Your role cannot ${action}`);
    return false;
  };
  const queryKey = queryKeys.admissions(tenantId, null);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => api.get<ApiKanbanBoard>("/admissions/kanban"),
  });
  const items = useMemo(() => (data ? kanbanToCards(data) : []), [data]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState<EnrollmentInvite | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /** Runs one write, then reloads the board so it shows what the backend stored. */
  const run = async <T,>(call: () => Promise<T>, success: (result: T) => string) => {
    setSaving(true);
    try {
      toast.success(success(await call()));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not update the inquiry."));
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
      case "enrol_unpaid":
        if (!canPropose && !canLock) {
          toast.error("Your role cannot propose or lock fees");
          return;
        }
        setPending({ kind: "fees", cardId: card.id });
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
        if (!allowed("payments.confirm", "confirm payments")) return;
        if (!card.invoiceNumber) {
          toast.error("No fee challan yet — Head Office must lock the fees first");
          return;
        }
        void run(
          () =>
            api.post<ApiStudentConversion>(
              `/admissions/challans/${encodeURIComponent(card.invoiceNumber!)}/confirm-payment`,
              { paymentMethod: "CASH" }
            ),
          (r) => `Payment confirmed — student ${r.studentCode ?? r.studentId} is active`
        );
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

  // Branch proposes the fee package; Head Office locks it, which issues the challan.
  const onFeeConfirm = (values: EnrollmentFeeValues) => {
    if (!pending) return;
    const id = pending.cardId;
    const card = pendingCard;
    setPending(null);
    void run(
      () =>
        api.post<ApiFeeLock>(
          `/admissions/inquiries/${id}/${locksFees ? "lock-fees" : "propose-fees"}`,
          feesBody(values)
        ),
      (r) => {
        // The lock is the only response that carries the parent's enrollment token.
        if (r.enrollmentToken) {
          setInvite({
            token: r.enrollmentToken,
            tenantSlug: "",
            email: card?.email ?? "",
            parentName: card?.parentName ?? "",
            status: "pending",
            createdAt: new Date().toISOString(),
            expiresAt: r.tokenExpiresAt ?? new Date().toISOString(),
            admissionId: id,
            prefill: {},
            securityHint: `Challan ${r.challanNumber ?? "pending"}${r.emailSent ? " · link emailed to the parent" : ""}`,
          });
        }
        return locksFees
          ? `Fees locked${r.challanNumber ? ` — challan ${r.challanNumber}` : ""}`
          : "Fee package sent for approval";
      }
    );
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

      <EnrollmentFeeModal
        open={pending?.kind === "fees"}
        card={pending?.kind === "fees" ? pendingCard : null}
        targetStageLabel={locksFees ? "HO Fee Lock" : "Propose fees for approval"}
        onCancel={() => setPending(null)}
        onConfirm={onFeeConfirm}
      />

      <EnrollmentInviteLinkModal open={!!invite} invite={invite} onClose={() => setInvite(null)} />
    </>
  );
}
