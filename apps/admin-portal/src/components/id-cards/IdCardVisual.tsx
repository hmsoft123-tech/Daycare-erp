"use client";

import { getInitials, formatDate, cn } from "@/lib/utils";
import type { PortalIdCard } from "@/types";
import { IdCard } from "lucide-react";

type Props = {
  card: PortalIdCard;
  className?: string;
  /** Larger for on-screen preview */
  size?: "sm" | "md" | "lg";
};

export function IdCardVisual({ card, className, size = "md" }: Props) {
  const isStudent = card.kind === "student";
  const dims =
    size === "lg"
      ? "w-[420px] min-h-[264px]"
      : size === "sm"
        ? "w-[280px] min-h-[176px]"
        : "w-[360px] min-h-[226px]";

  return (
    <div
      className={cn(
        "id-card-print relative overflow-hidden rounded-2xl border border-[#DFE3E8] bg-white shadow-card",
        dims,
        className
      )}
    >
      {/* Brand strip */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5 text-white",
          isStudent
            ? "bg-gradient-to-r from-brand-600 to-brand-500"
            : "bg-gradient-to-r from-[#1C252E] to-[#454F5B]"
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-90">
            Kinder Pilot
          </p>
          <p className="text-sm font-bold leading-tight">
            {isStudent ? "Student ID Card" : "Staff ID Card"}
          </p>
        </div>
        <IdCard className="h-7 w-7 opacity-90" />
      </div>

      <div className="flex gap-3 p-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-bg ring-1 ring-[#DFE3E8]">
          {card.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center text-lg font-bold",
                isStudent ? "bg-brand-50 text-brand-700" : "bg-[#F4F6F8] text-[#454F5B]"
              )}
            >
              {getInitials(card.fullName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-heading text-base font-bold text-heading">{card.fullName}</p>
          <p className="truncate text-xs font-medium text-brand-700">{card.subtitle}</p>
          {card.secondaryLine && (
            <p className="truncate text-[11px] text-muted">{card.secondaryLine}</p>
          )}
          <p className="truncate text-[11px] text-muted">{card.branchName}</p>
          <div className="mt-2 inline-flex rounded-md bg-bg px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-heading">
            {card.cardNumber}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#F1F3F5] bg-[#F9FAFB] px-4 py-2 text-[10px] text-muted">
        <span>Issued {formatDate(card.issuedAt)}</span>
        <span>Valid until {formatDate(card.validUntil)}</span>
        {card.bloodGroup && <span>Blood {card.bloodGroup}</span>}
      </div>
    </div>
  );
}
