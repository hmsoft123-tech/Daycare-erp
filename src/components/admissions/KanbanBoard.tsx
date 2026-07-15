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
import { useBranchFilter } from "@/lib/hooks/use-branch-filter";
import type { AdmissionCard, AdmissionStage } from "@/types";
import { cn } from "@/lib/utils";

const STAGES: { id: AdmissionStage; label: string; color: string }[] = [
  { id: "new_inquiry", label: "New Inquiry", color: "border-blue-400" },
  { id: "tour_scheduled", label: "Tour Scheduled", color: "border-purple-400" },
  { id: "waitlist", label: "Waitlist", color: "border-amber-400" },
  { id: "enrolled", label: "Enrolled", color: "border-emerald-400" },
  { id: "rejected", label: "Rejected", color: "border-red-400" },
];

interface KanbanBoardProps {
  admissions: AdmissionCard[];
}

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
        <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">{cards.length}</span>
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

  useEffect(() => {
    setItems(filtered);
  }, [filtered]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overStage = over.id as AdmissionStage;
    if (STAGES.some((s) => s.id === overStage)) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === active.id ? { ...item, stage: overStage, daysInStage: 0 } : item
        )
      );
    }
  };

  const activeCard = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} cards={items.filter((c) => c.stage === stage.id)} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <KanbanCard card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
