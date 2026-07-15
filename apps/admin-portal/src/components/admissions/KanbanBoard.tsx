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
import type { AdmissionCard, AdmissionStage } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES: { id: AdmissionStage; label: string; color: string }[] = [
  { id: "new_inquiry", label: "New Inquiry", color: "border-blue-400" },
  { id: "meeting_test_scheduled", label: "Tour Scheduled", color: "border-purple-400" },
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
  const filtered = useMemo(
    () => (branchId ? admissions.filter((a) => a.branchId === branchId) : admissions),
    [admissions, branchId]
  );

  const [items, setItems] = useState<AdmissionCard[]>(filtered);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);

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

    // Into Enrol Unpaid or Enrolled (paid) → open fee form
    if (overStage === "enrol_unpaid" || overStage === "paid") {
      setPending({ kind: "fees", cardId: card.id, to: overStage });
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

  const onFeeConfirm = (values: EnrollmentFeeValues) => {
    if (!pending || pending.kind !== "fees") return;
    const invoiceNumber =
      pending.to === "enrol_unpaid"
        ? `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
        : undefined;
    applyMove(pending.cardId, pending.to, {
      monthlyTuition: values.monthlyTuition,
      admissionFee: values.admissionFee,
      registrationFee: values.admissionFee,
      discountType: values.discountType,
      discountValue: values.discountValue,
      feeNotes: values.feeNotes,
      invoiceNumber,
    });
    setPending(null);
    toast.success(
      pending.to === "paid" ? "Moved to Enrolled with fees saved" : "Enrol unpaid — fees & invoice set"
    );
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
    </>
  );
}
