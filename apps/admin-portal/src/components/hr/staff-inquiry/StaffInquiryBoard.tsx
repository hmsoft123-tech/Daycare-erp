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
import { StaffInquiryCardView } from "./StaffInquiryCard";
import {
  ScheduleInterviewModal,
  type ScheduleInterviewValues,
} from "./ScheduleInterviewModal";
import { HireOfferModal, type HireOfferValues } from "./HireOfferModal";
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import type { StaffInquiryCard, StaffInquiryStage } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES: { id: StaffInquiryStage; label: string; color: string }[] = [
  { id: "new_inquiry", label: "New Inquiry", color: "border-blue-400" },
  { id: "interview_scheduled", label: "Interview Scheduled", color: "border-purple-400" },
  { id: "offer_pending", label: "Offer Pending", color: "border-orange-400" },
  { id: "hired", label: "Hired", color: "border-emerald-400" },
  { id: "waitlist", label: "Talent Pool", color: "border-amber-400" },
];

type PendingMove =
  | { kind: "interview"; cardId: string; to: StaffInquiryStage }
  | { kind: "offer"; cardId: string; to: StaffInquiryStage };

function KanbanColumn({
  stage,
  cards,
}: {
  stage: (typeof STAGES)[number];
  cards: StaffInquiryCard[];
}) {
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
          <StaffInquiryCardView key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export function StaffInquiryBoard({ inquiries }: { inquiries: StaffInquiryCard[] }) {
  const branchId = useBranchFilter();
  const filtered = useMemo(
    () => (branchId ? inquiries.filter((a) => a.branchId === branchId) : inquiries),
    [inquiries, branchId]
  );

  const [items, setItems] = useState<StaffInquiryCard[]>(filtered);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);

  useEffect(() => {
    setItems(filtered);
  }, [filtered]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const applyMove = (cardId: string, to: StaffInquiryStage, patch: Partial<StaffInquiryCard> = {}) => {
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

    const overStage = over.id as StaffInquiryStage;
    if (!STAGES.some((s) => s.id === overStage)) return;

    const card = items.find((i) => i.id === active.id);
    if (!card || card.stage === overStage) return;

    if (card.stage === "new_inquiry" && overStage === "interview_scheduled") {
      setPending({ kind: "interview", cardId: card.id, to: overStage });
      return;
    }

    if (overStage === "offer_pending" || overStage === "hired") {
      setPending({ kind: "offer", cardId: card.id, to: overStage });
      return;
    }

    applyMove(card.id, overStage);
  };

  const pendingCard = pending ? items.find((i) => i.id === pending.cardId) ?? null : null;
  const offerLabel =
    pending?.kind === "offer"
      ? STAGES.find((s) => s.id === pending.to)?.label ?? "Offer"
      : "Offer";

  const stageCounts = useMemo(
    () =>
      STAGES.map((s) => ({
        ...s,
        count: items.filter((c) => c.stage === s.id).length,
      })),
    [items]
  );

  const activeCard = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <>
      <div className="sticky top-[72px] z-20 -mx-4 mb-4 border-b border-[#F1F3F5] bg-bg/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Hiring pipeline · drag cards to advance
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
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
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
        <DragOverlay>
          {activeCard ? <StaffInquiryCardView card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      <ScheduleInterviewModal
        open={pending?.kind === "interview"}
        card={pending?.kind === "interview" ? pendingCard : null}
        onCancel={() => setPending(null)}
        onConfirm={(values: ScheduleInterviewValues) => {
          if (!pending || pending.kind !== "interview") return;
          applyMove(pending.cardId, pending.to, values);
          setPending(null);
          toast.success("Interview scheduled");
        }}
      />

      <HireOfferModal
        open={pending?.kind === "offer"}
        card={pending?.kind === "offer" ? pendingCard : null}
        targetStageLabel={offerLabel}
        onCancel={() => setPending(null)}
        onConfirm={(values: HireOfferValues) => {
          if (!pending || pending.kind !== "offer") return;
          const hired = pending.to === "hired";
          applyMove(pending.cardId, pending.to, values);
          setPending(null);
          toast.success(
            hired
              ? "Candidate hired — appears in staff directory after sync"
              : "Offer saved — pending candidate response"
          );
        }}
      />
    </>
  );
}
