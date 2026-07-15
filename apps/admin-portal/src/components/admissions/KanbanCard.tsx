"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials, cn, formatCurrency } from "@/lib/utils";
import type { AdmissionCard, AdmissionTag, DiscountType, InquiryType, MeetingKind } from "@/types";
import { CalendarClock, Clock, CreditCard, Mail, Percent } from "lucide-react";

interface KanbanCardProps {
  card: AdmissionCard;
}

const TAG_LABELS: Record<AdmissionTag, string> = {
  hot_lead: "Hot Lead",
  walk_in: "Walk-in",
  referral: "Referral",
  sibling: "Sibling",
  online: "Online",
  campaign: "Campaign",
};

const TAG_STYLES: Record<AdmissionTag, string> = {
  hot_lead: "bg-soft-red text-danger",
  walk_in: "bg-soft-cyan text-[#006C9C]",
  referral: "bg-soft-blue text-[#0B6BCB]",
  sibling: "bg-soft-green text-brand-700",
  online: "bg-brand-50 text-brand-700",
  campaign: "bg-soft-yellow text-[#B76E00]",
};

const TYPE_LABELS: Record<InquiryType, string> = {
  admission: "Admission",
  employment: "Employment",
  tour: "Tour",
  general: "General",
};

const MEETING_LABELS: Record<MeetingKind, string> = {
  tour: "Tour",
  test: "Test",
  interview: "Interview",
  assessment: "Assessment",
};

const DISCOUNT_LABELS: Record<DiscountType, string> = {
  none: "No discount",
  percent: "% off",
  fixed: "Fixed off",
  sibling: "Sibling",
  scholarship: "Scholarship",
  staff: "Staff",
  promo: "Promo",
};

function formatInquiryStamp(createdAt: string, inquiryTime: string) {
  try {
    const d = new Date(`${createdAt}T${inquiryTime.length === 5 ? `${inquiryTime}:00` : inquiryTime}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    /* fall through */
  }
  return `${createdAt} · ${inquiryTime}`;
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
      <Card className="cursor-grab shadow-card transition-shadow active:cursor-grabbing hover:shadow-card-hover">
        <CardContent className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                TAG_STYLES[card.tag]
              )}
            >
              {TAG_LABELS[card.tag]}
            </span>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {TYPE_LABELS[card.type]}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              {card.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar} alt={card.studentName} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                  {getInitials(card.studentName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link href={`/admissions/${card.id}`} className="font-semibold text-heading hover:text-brand-500">
                {card.studentName}
              </Link>
              <p className="text-xs text-muted">
                Age {card.age} · {card.program}
              </p>
              <p className="text-xs text-muted">{card.parentName}</p>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{card.description}</p>

          <div className="mt-2 flex items-center gap-1.5 truncate text-xs text-heading">
            <Mail className="h-3 w-3 shrink-0 text-muted" />
            <span className="truncate">{card.email}</span>
          </div>

          {card.stage === "new_inquiry" && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
              <Clock className="h-3 w-3" />
              Inquiry · {formatInquiryStamp(card.createdAt, card.inquiryTime)}
            </div>
          )}

          {card.stage === "meeting_test_scheduled" && card.meetingDate && (
            <div className="mt-2 space-y-0.5 rounded-md bg-purple-50 px-2 py-1.5 text-[10px] font-medium text-purple-800">
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {card.meetingKind ? MEETING_LABELS[card.meetingKind] : "Meeting"} · {card.meetingDate}
                {card.meetingTime ? ` · ${card.meetingTime}` : ""}
              </div>
              {card.meetingLocation && (
                <p className="truncate pl-4 text-purple-700/80">{card.meetingLocation}</p>
              )}
            </div>
          )}

          {(card.stage === "enrol_unpaid" || card.stage === "paid") &&
            (card.monthlyTuition != null || card.admissionFee != null) && (
              <div className="mt-2 space-y-0.5 rounded-md bg-soft-green px-2 py-1.5 text-[10px] font-medium text-brand-800">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Tuition {formatCurrency(card.monthlyTuition ?? 0)}
                  {card.admissionFee != null ? ` · Admit ${formatCurrency(card.admissionFee)}` : ""}
                </div>
                {card.discountType && card.discountType !== "none" && (
                  <div className="flex items-center gap-1 text-brand-700">
                    <Percent className="h-3 w-3" />
                    {DISCOUNT_LABELS[card.discountType]}
                    {card.discountValue
                      ? card.discountType === "percent"
                        ? ` · ${card.discountValue}%`
                        : ` · ${formatCurrency(card.discountValue)}`
                      : ""}
                  </div>
                )}
                {card.feeNotes && <p className="line-clamp-2 text-brand-700/80">{card.feeNotes}</p>}
                {card.stage === "enrol_unpaid" && card.invoiceNumber && (
                  <p className="text-orange-700">{card.invoiceNumber} · unpaid</p>
                )}
              </div>
            )}

          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#919EAB]">
            <Clock className="h-3 w-3" />
            {card.daysInStage} days in stage
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
