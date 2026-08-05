"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanCard } from "./KanbanCard";
import {
  ScheduleMeetingModal,
  type ScheduleMeetingValues,
} from "./ScheduleMeetingModal";
import {
  EnrollmentFeeModal,
  type EnrollmentFeeValues,
} from "./EnrollmentFeeModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import { useUIStore } from "@/lib/store";
import { students } from "@/data/students";
import {
  decideFeeLockRequest,
  getFeeLockRequests,
  requestAdmissionFeeLock,
} from "@/lib/mock-service";
import { issueStudentIdCard } from "@/lib/id-card-store";
import { generateStudentCardNumber } from "@/lib/id-card";
import { IdCardPreviewModal } from "@/components/id-cards/IdCardPreviewModal";
import type { AdmissionCard, AdmissionStage, PortalIdCard, Student } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES: { id: AdmissionStage; label: string; color: string }[] = [
  { id: "new_inquiry", label: "New Inquiry", color: "border-blue-400" },
  { id: "meeting_test_scheduled", label: "Tour Scheduled", color: "border-purple-400" },
  { id: "pending_ho_fee", label: "HO Fee Lock", color: "border-amber-500" },
  { id: "enrol_unpaid", label: "Enrol Unpaid", color: "border-orange-400" },
  { id: "paid", label: "Enrolled", color: "border-emerald-400" },
  { id: "waitlist", label: "Waitlist", color: "border-amber-400" },
];

interface KanbanBoardProps {
  admissions: AdmissionCard[];
}

type PendingMove =
  | { kind: "schedule"; cardId: string; to: AdmissionStage }
  | { kind: "fees"; cardId: string; to: AdmissionStage };

function KanbanColumn({ stage, cards }: { stage: (typeof STAGES)[number]; cards: AdmissionCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[280px] flex-1 rounded-2xl border-t-4 bg-bg p-3",
        stage.color,
        isOver && "ring-2 ring-brand-500/40 bg-brand-50"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">{stage.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted">
          {cards.length}
        </span>
      </div>
      <div className="space-y-3">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ admissions }: KanbanBoardProps) {
  const branchId = useBranchFilter();
  const { contextType } = useUIStore();
  const isHeadOffice = contextType === "head_office";
  const filtered = useMemo(
    () => (branchId ? admissions.filter((a) => a.branchId === branchId) : admissions),
    [admissions, branchId]
  );

  const [items, setItems] = useState<AdmissionCard[]>(filtered);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [issuedCard, setIssuedCard] = useState<PortalIdCard | null>(null);

  useEffect(() => {
    setItems(filtered);
  }, [filtered]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const applyMove = (cardId: string, to: AdmissionStage, patch: Partial<AdmissionCard> = {}) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === cardId ? { ...item, ...patch, stage: to, daysInStage: 0 } : item
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overStage = over.id as AdmissionStage;
    if (!STAGES.some((s) => s.id === overStage)) return;

    const card = items.find((i) => i.id === active.id);
    if (!card || card.stage === overStage) return;

    // New Inquiry → Tour Scheduled → open schedule form
    if (card.stage === "new_inquiry" && overStage === "meeting_test_scheduled") {
      setPending({ kind: "schedule", cardId: card.id, to: overStage });
      return;
    }

    // HO can advance pending_ho_fee → enrol_unpaid after approving fee lock
    if (
      card.stage === "pending_ho_fee" &&
      overStage === "enrol_unpaid" &&
      isHeadOffice
    ) {
      void (async () => {
        const locks = await getFeeLockRequests();
        const lock = locks.find(
          (r) => r.admissionId === card.id && r.status === "pending_ho"
        );
        if (!lock) {
          toast.error("No pending fee-lock request — open Billing → Fee Lock Approvals");
          return;
        }
        const result = await decideFeeLockRequest(lock.id, "approved");
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        applyMove(card.id, "enrol_unpaid", {
          monthlyTuition: result.request.monthlyTuition,
          admissionFee: result.request.admissionFee,
          registrationFee: result.request.admissionFee,
          discountType: result.request.discountType,
          discountValue: result.request.discountValue,
          feeNotes: result.request.feeNotes,
          invoiceNumber: result.request.invoiceNumber,
        });
        toast.success("HO approved — student is enrol unpaid (fee locked)");
      })();
      return;
    }

    // Branch cannot skip HO: enrol unpaid / HO fee lock → fee form → pending_ho_fee
    if (overStage === "pending_ho_fee" || overStage === "enrol_unpaid" || overStage === "paid") {
      if (overStage === "enrol_unpaid" && !isHeadOffice && card.stage !== "pending_ho_fee") {
        setPending({ kind: "fees", cardId: card.id, to: "pending_ho_fee" });
        return;
      }
      if (overStage === "enrol_unpaid" && !isHeadOffice) {
        toast.error("Head Office must approve the fee lock before Enrol Unpaid");
        return;
      }
      setPending({ kind: "fees", cardId: card.id, to: overStage === "enrol_unpaid" ? "pending_ho_fee" : overStage });
      return;
    }

    applyMove(card.id, overStage);
  };

  const pendingCard = pending ? items.find((i) => i.id === pending.cardId) ?? null : null;
  const feeTargetLabel =
    pending?.kind === "fees"
      ? STAGES.find((s) => s.id === pending.to)?.label ?? "Enrollment"
      : "Enrollment";

  const onScheduleConfirm = (values: ScheduleMeetingValues) => {
    if (!pending || pending.kind !== "schedule") return;
    applyMove(pending.cardId, pending.to, values);
    setPending(null);
    toast.success("Tour / meeting scheduled");
  };

  const onFeeConfirm = async (values: EnrollmentFeeValues) => {
    if (!pending || pending.kind !== "fees") return;
    const card = items.find((i) => i.id === pending.cardId);
    const target = pending.to;
    setPending(null);

    if (target === "paid" && card) {
      applyMove(card.id, "paid", {
        monthlyTuition: values.monthlyTuition,
        admissionFee: values.admissionFee,
        registrationFee: values.admissionFee,
        discountType: values.discountType,
        discountValue: values.discountValue,
        feeNotes: values.feeNotes,
      });
      const id = `s-${card.id}-${Date.now()}`;
      const cardNumber = generateStudentCardNumber(id);
      const [firstName, ...rest] = card.studentName.trim().split(/\s+/);
      const lastName = rest.join(" ") || firstName;
      const student: Student = {
        id,
        firstName,
        lastName,
        dob: new Date(new Date().getFullYear() - (card.age || 4), 0, 1).toISOString().slice(0, 10),
        bloodGroup: "N/A",
        allergies: [],
        branchId: card.branchId,
        classId: "c1",
        className: card.classroom || card.program,
        enrollmentDate: new Date().toISOString().slice(0, 10),
        status: "active",
        parentIds: [],
        photo: card.avatar,
        feePlan: "Full Day Monthly",
        gender: "male",
        idCardNumber: cardNumber,
      };
      students.unshift(student);
      const idCard = await issueStudentIdCard(student.id);
      setIssuedCard(idCard);
      toast.success(`Enrolled — student ID card ${cardNumber} generated`);
      return;
    }

    // pending_ho_fee / enrol_unpaid from branch → HO queue (not pending payment yet)
    if (!card) return;
    const result = await requestAdmissionFeeLock({
      admissionId: card.id,
      monthlyTuition: values.monthlyTuition,
      admissionFee: values.admissionFee,
      discountType: values.discountType,
      discountValue: values.discountValue,
      feeNotes: values.feeNotes,
      feePlan: card.program,
      requestedBy: isHeadOffice ? "Head Office" : "Branch Admin",
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    // HO can approve immediately; branch waits in HO Fee Lock column
    if (isHeadOffice) {
      const decided = await decideFeeLockRequest(result.request.id, "approved", {
        decidedBy: "Head Office",
      });
      if (!decided.ok) {
        toast.error(decided.error);
        return;
      }
      applyMove(card.id, "enrol_unpaid", {
        monthlyTuition: values.monthlyTuition,
        admissionFee: values.admissionFee,
        registrationFee: values.admissionFee,
        discountType: values.discountType,
        discountValue: values.discountValue,
        feeNotes: values.feeNotes,
        invoiceNumber: decided.request.invoiceNumber,
      });
      toast.success("HO fee lock approved — enrol unpaid (pending payment)");
      return;
    }

    applyMove(card.id, "pending_ho_fee", {
      monthlyTuition: values.monthlyTuition,
      admissionFee: values.admissionFee,
      registrationFee: values.admissionFee,
      discountType: values.discountType,
      discountValue: values.discountValue,
      feeNotes: values.feeNotes,
      invoiceNumber: undefined,
    });
    toast.success("Sent to Head Office for fee-lock approval — not pending until approved");
  };

  const activeCard = activeId ? items.find((i) => i.id === activeId) : null;

  const stageCounts = useMemo(
    () =>
      STAGES.map((s) => ({
        ...s,
        count: items.filter((c) => c.stage === s.id).length,
      })),
    [items]
  );

  return (
    <>
      {/* Sticky pipeline steps — always visible while scrolling kanban */}
      <div className="sticky top-[72px] z-20 -mx-4 mb-4 border-b border-[#F1F3F5] bg-bg/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Pipeline stages · drag cards to advance
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stageCounts.map((s, i) => (
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
                {s.count}
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
        targetStageLabel={feeTargetLabel}
        onCancel={() => setPending(null)}
        onConfirm={onFeeConfirm}
      />

      <IdCardPreviewModal
        open={!!issuedCard}
        card={issuedCard}
        onClose={() => setIssuedCard(null)}
        title="Student ID Card generated"
        subtitle="Student saved to the portal directory. Print for campus use."
      />
    </>
  );
}
