"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

const controlClass =
  "h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-heading outline-none focus:border-brand-400";

export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  className,
}: {
  label: string;
  value: T | "all";
  onChange: (v: T | "all") => void;
  options: { value: T; label: string }[];
  allLabel?: string;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value as T | "all")} className={controlClass}>
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}

export function FilterInput({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FilterField label={label} className={className}>
      <input {...props} className={controlClass} />
    </FilterField>
  );
}

/** From / to pair for date or number ranges */
export function RangeFilter({
  label,
  type,
  from,
  to,
  onFrom,
  onTo,
  className,
}: {
  label: string;
  type: "date" | "number";
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <div className="flex items-center gap-1">
        <input
          type={type}
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className={controlClass}
          placeholder={type === "number" ? "Min" : undefined}
          aria-label={`${label} from`}
        />
        <span className="text-xs text-muted">–</span>
        <input
          type={type}
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className={controlClass}
          placeholder={type === "number" ? "Max" : undefined}
          aria-label={`${label} to`}
        />
      </div>
    </FilterField>
  );
}

/** "Sort by" select + ascending / descending toggle */
export function SortControl<K extends string>({
  sortKey,
  dir,
  options,
  onKey,
  onDir,
}: {
  sortKey: K;
  dir: SortDir;
  options: { value: K; label: string }[];
  onKey: (k: K) => void;
  onDir: (d: SortDir) => void;
}) {
  return (
    <FilterField label="Sort by / Order">
      <div className="flex items-center gap-1">
        <select value={sortKey} onChange={(e) => onKey(e.target.value as K)} className={controlClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={dir}
          onChange={(e) => onDir(e.target.value as SortDir)}
          className={cn(controlClass, "w-[118px] shrink-0")}
          aria-label="Order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </FilterField>
  );
}

/** Clickable column header: click to sort, click again to flip order */
export function SortHeader<K extends string>({
  label,
  column,
  sortKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  column: K;
  sortKey: K;
  dir: SortDir;
  onSort: (k: K, d: SortDir) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column, active && dir === "asc" ? "desc" : "asc")}
      className={cn(
        "inline-flex items-center gap-1 uppercase tracking-wider hover:text-heading",
        active && "text-heading",
        align === "right" && "flex-row-reverse"
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon className={cn("h-3 w-3", !active && "opacity-40")} />
    </button>
  );
}

/** Generic comparator: strings case-insensitive, numbers numeric, empty values last */
export function compareValues(a: string | number | undefined, b: string | number | undefined, dir: SortDir): number {
  const emptyA = a === undefined || a === "";
  const emptyB = b === undefined || b === "";
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  const r =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  return dir === "asc" ? r : -r;
}
