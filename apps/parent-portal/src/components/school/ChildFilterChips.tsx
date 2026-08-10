"use client";

import { cn } from "@kinder-pilot/ui";
import { mockChildren } from "@/data/mock";

type Props = {
  value: string;
  onChange: (childId: string) => void;
  /** Include pending_first_payment children (default false for academics) */
  includePending?: boolean;
};

export function ChildFilterChips({ value, onChange, includePending = false }: Props) {
  const kids = mockChildren.filter(
    (c) => includePending || c.enrollmentStatus === "active"
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
          value === "all" ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
        )}
      >
        All kids
      </button>
      {kids.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
            value === c.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
          )}
        >
          {c.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
