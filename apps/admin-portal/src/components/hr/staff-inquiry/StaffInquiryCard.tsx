"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials, cn, formatCurrency } from "@/lib/utils";
import type { StaffInquiryCard, StaffInquiryTag, StaffInterviewKind, StaffRole } from "@/types";
import { Briefcase, CalendarClock, Clock, Mail, Phone } from "lucide-react";

const TAG_LABELS: Record<StaffInquiryTag, string> = {
  hot_lead: "Hot Lead",
  referral: "Referral",
  walk_in: "Walk-in",
  online: "Online",
  campus_posting: "Campus Post",
  agency: "Agency",
};

const TAG_STYLES: Record<StaffInquiryTag, string> = {
  hot_lead: "bg-soft-red text-danger",
  referral: "bg-soft-blue text-[#0B6BCB]",
  walk_in: "bg-soft-cyan text-[#006C9C]",
  online: "bg-brand-50 text-brand-700",
  campus_posting: "bg-soft-yellow text-[#B76E00]",
  agency: "bg-soft-green text-brand-700",
};

const ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "Teacher",
  therapist: "Therapist",
  admin: "Admin",
  support: "Support",
  accountant: "Accountant",
  executive: "Executive",
};

const INTERVIEW_LABELS: Record<StaffInterviewKind, string> = {
  phone: "Phone",
  in_person: "In-person",
  demo: "Demo",
  panel: "Panel",
};

function stamp(createdAt: string, inquiryTime: string) {
  try {
    const d = new Date(`${createdAt}T${inquiryTime.length === 5 ? `${inquiryTime}:00` : inquiryTime}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  } catch {
    /* ignore */
  }
  return `${createdAt} · ${inquiryTime}`;
}

export function StaffInquiryCardView({ card }: { card: StaffInquiryCard }) {
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
              {ROLE_LABELS[card.role]}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              {card.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar} alt={card.name} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700">
                  {getInitials(card.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link href={`/hr/inquiries/${card.id}`} className="font-semibold text-heading hover:text-brand-500">
                {card.name}
              </Link>
              <p className="text-xs text-muted">{card.experienceYears} yrs experience</p>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{card.description}</p>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 truncate text-xs text-heading">
              <Mail className="h-3 w-3 shrink-0 text-muted" />
              <span className="truncate">{card.email}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{card.phone}</span>
            </div>
          </div>

          {card.stage === "new_inquiry" && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
              <Clock className="h-3 w-3" />
              Inquiry · {stamp(card.createdAt, card.inquiryTime)}
            </div>
          )}

          {card.stage === "interview_scheduled" && card.interviewDate && (
            <div className="mt-2 space-y-0.5 rounded-md bg-purple-50 px-2 py-1.5 text-[10px] font-medium text-purple-800">
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {card.interviewKind ? INTERVIEW_LABELS[card.interviewKind] : "Interview"} · {card.interviewDate}
                {card.interviewTime ? ` · ${card.interviewTime}` : ""}
              </div>
              {card.interviewLocation && (
                <p className="truncate pl-4 text-purple-700/80">{card.interviewLocation}</p>
              )}
            </div>
          )}

          {(card.stage === "offer_pending" || card.stage === "hired") && card.offeredSalary != null && (
            <div className="mt-2 space-y-0.5 rounded-md bg-soft-green px-2 py-1.5 text-[10px] font-medium text-brand-800">
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {formatCurrency(card.offeredSalary)} / mo
                {card.employmentType ? ` · ${card.employmentType.replace("_", " ")}` : ""}
              </div>
              {card.joiningDate && <p className="pl-4">Join {card.joiningDate}</p>}
              {card.offerNotes && <p className="line-clamp-2 text-brand-700/80">{card.offerNotes}</p>}
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
