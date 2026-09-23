import { Clock } from "lucide-react";
import { formatStamp, formatStampDate, formatStampTime } from "@/lib/audit";
import { cn } from "@/lib/utils";
import type { AuditStamp } from "@/types";

type Props = {
  stamp?: AuditStamp | { updatedAt: string; updatedBy?: string };
  /** `inline`: one line for cards/headers · `compact`: two short lines for table cells */
  variant?: "inline" | "compact";
  className?: string;
};

/** Standard "Last Updated: date, time · Updated By: user" line used across the ERP. */
export function LastUpdated({ stamp, variant = "inline", className }: Props) {
  if (!stamp?.updatedAt) {
    return <span className={cn("text-[11px] text-muted", className)}>Last Updated: not recorded</span>;
  }
  const by = stamp.updatedBy || "—";

  if (variant === "compact") {
    const time = formatStampTime(stamp.updatedAt);
    return (
      <div className={cn("leading-tight", className)}>
        <p className="text-xs text-heading">
          {formatStampDate(stamp.updatedAt)}
          {time && <span className="text-muted">, {time}</span>}
        </p>
        <p className="text-[11px] text-muted">by {by}</p>
      </div>
    );
  }

  return (
    <p className={cn("inline-flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted", className)}>
      <Clock className="h-3 w-3 shrink-0" />
      <span>
        Last Updated: <span className="font-medium text-heading">{formatStamp(stamp.updatedAt)}</span>
      </span>
      <span aria-hidden>·</span>
      <span>
        Updated By: <span className="font-medium text-heading">{by}</span>
      </span>
    </p>
  );
}
