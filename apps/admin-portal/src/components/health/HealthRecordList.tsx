import { LastUpdated } from "@/components/common/LastUpdated";
import { HEALTH_CATEGORY_LABEL, HEALTH_FREQUENCY_LABEL, HEALTH_OUTCOME_LABEL } from "@/data/health-safety";
import { cn, formatDate } from "@/lib/utils";
import type { HealthOutcome, HealthRecord } from "@/types";

export const OUTCOME_TONE: Record<HealthOutcome, string> = {
  clear: "bg-soft-green text-brand-700",
  completed: "bg-soft-green text-brand-700",
  negative: "bg-soft-green text-brand-700",
  pending: "bg-soft-yellow text-[#B76E00]",
  attention: "bg-soft-yellow text-[#B76E00]",
  referred: "bg-soft-red text-danger",
  positive: "bg-soft-red text-danger",
};

/** Compact read-only list — used on student / staff profiles */
export function HealthRecordList({ records, emptyText }: { records: HealthRecord[]; emptyText: string }) {
  if (records.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {records.map((r) => (
        <li key={r.id} className="rounded-xl border border-border p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-heading">{r.title}</p>
              <p className="text-xs text-muted">
                {HEALTH_CATEGORY_LABEL[r.category]} · {HEALTH_FREQUENCY_LABEL[r.frequency]} · {formatDate(r.date)}
                {r.specifics ? ` · ${r.specifics}` : ""}
              </p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", OUTCOME_TONE[r.outcome])}>
              {HEALTH_OUTCOME_LABEL[r.outcome]}
            </span>
          </div>
          {r.details && <p className="mt-1 text-xs text-muted">{r.details}</p>}
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
            {r.followUpRequired && !r.followUpDone && (
              <span className="font-semibold text-[#B76E00]">
                Follow-up due {r.followUpDate ? formatDate(r.followUpDate) : "—"}
              </span>
            )}
            {r.nextDueDate && <span className="text-muted">Next due / renewal {formatDate(r.nextDueDate)}</span>}
          </div>
          <LastUpdated stamp={r.lastUpdated} className="mt-1.5" />
        </li>
      ))}
    </ul>
  );
}
