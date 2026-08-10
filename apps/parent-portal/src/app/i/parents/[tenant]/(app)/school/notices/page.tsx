"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { ChildFilterChips } from "@/components/school/ChildFilterChips";
import { formatSchoolDate, mockNotices, type NoticeItem } from "@/data/school";
import { fetchSchoolNotices } from "@/lib/school-api";

export default function NoticesPage() {
  const [items, setItems] = useState<NoticeItem[]>(mockNotices);
  const [childId, setChildId] = useState("all");
  const [priority, setPriority] = useState<"all" | "important" | "normal">("all");

  useEffect(() => {
    fetchSchoolNotices().then(setItems);
  }, []);

  const rows = useMemo(() => {
    return items.filter((n) => {
      const childOk =
        childId === "all" ||
        !n.childIds?.length ||
        n.audience === "all" ||
        n.childIds.includes(childId);
      const priorityOk = priority === "all" || n.priority === priority;
      return childOk && priorityOk;
    });
  }, [items, childId, priority]);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader title="Notices" subtitle="Announcements from the school office" />
      <ChildFilterChips value={childId} onChange={setChildId} />
      <div className="flex gap-2">
        {(
          [
            ["all", "All"],
            ["important", "Important"],
            ["normal", "General"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPriority(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              priority === id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {rows.map((n) => (
          <li
            key={n.id}
            className={cn(
              "rounded-2xl bg-surface p-4 shadow-card",
              n.priority === "important" && "ring-1 ring-amber-300"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {n.priority === "important" && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Important
                </span>
              )}
              <span className="text-[11px] font-semibold capitalize text-muted">
                {n.audience} notice
              </span>
              <span className="text-[11px] text-muted">· {formatSchoolDate(n.date)}</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-heading">{n.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-heading/85">{n.body}</p>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted">
            No notices for these filters.
          </li>
        )}
      </ul>
    </div>
  );
}
