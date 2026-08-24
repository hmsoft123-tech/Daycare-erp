"use client";

import { useEffect, useState } from "react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { fetchParentOps } from "@/lib/parent-ops-api";
import { cn } from "@kinder-pilot/ui";

type Loan = {
  id: string;
  bookTitle: string;
  childId: string;
  childName: string;
  issuedOn: string;
  dueOn: string;
  returnedOn?: string;
  status: string;
};

export default function ParentLibraryPage() {
  const [childId, setChildId] = useState("all");
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    fetchParentOps<Loan>("library", []).then(setLoans);
  }, []);

  const rows =
    childId === "all" ? loans : loans.filter((l) => l.childId === childId);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Digital library"
        subtitle="Issued books · due dates · returned / overdue"
      />
      <ChildFilterChips value={childId} onChange={setChildId} />
      <ul className="space-y-2">
        {rows.map((l) => (
          <li key={l.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{l.bookTitle}</p>
                <p className="text-xs text-muted">
                  {l.childName} · issued {l.issuedOn} · due {l.dueOn}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                  l.status === "returned"
                    ? "bg-soft-green text-[#0E9F6E]"
                    : l.status === "overdue"
                      ? "bg-soft-red text-danger"
                      : "bg-soft-yellow text-[#B76E00]"
                )}
              >
                {l.status}
              </span>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted">
            No library loans for this child.
          </li>
        )}
      </ul>
    </div>
  );
}
