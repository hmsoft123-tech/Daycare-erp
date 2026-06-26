"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import type { AdmissionCard } from "@/types";
import { Clock } from "lucide-react";

interface KanbanCardProps {
  card: AdmissionCard;
}

export function KanbanCard({ card }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              {card.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar} alt={card.studentName} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-brand-100 text-xs">{getInitials(card.studentName)}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link href={`/admissions/${card.id}`} className="font-medium text-brand-900 hover:underline">
                {card.studentName}
              </Link>
              <p className="text-xs text-gray-500">Age {card.age} · {card.program}</p>
              <p className="text-xs text-gray-500">{card.parentName}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {card.daysInStage} days in stage
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
