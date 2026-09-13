"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCategoryProps = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Clear labeled block for dense dashboards / analytics */
export function SectionCategory({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: SectionCategoryProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 space-y-4 rounded-2xl border border-border bg-surface/60 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-heading text-base font-semibold text-heading sm:text-lg">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type CategoryNavProps = {
  items: { id: string; label: string }[];
};

export function CategoryNav({ items }: CategoryNavProps) {
  return (
    <nav
      aria-label="Page categories"
      className="sticky top-[72px] z-20 -mx-1 overflow-x-auto px-1 pb-1"
    >
      <ul className="flex w-max gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-card">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-bg hover:text-heading"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
