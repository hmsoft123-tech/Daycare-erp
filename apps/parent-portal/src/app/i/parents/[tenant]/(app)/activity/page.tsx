"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  GraduationCap,
  LogIn,
  LogOut,
  Moon,
  NotebookPen,
  Palette,
  Toilet,
  Utensils,
} from "lucide-react";
import { mockChildren, mockFeed, type FeedItem } from "@/data/mock";
import { fetchClassroomFeed } from "@/lib/classroom-feed";
import { cn } from "@kinder-pilot/ui";

const filters = [
  { id: "all", label: "All" },
  { id: "activity", label: "Activities" },
  { id: "learning", label: "Learning" },
  { id: "meal", label: "Meals" },
  { id: "nap", label: "Naps" },
  { id: "photo", label: "Photos" },
  { id: "checkin", label: "Check-in" },
] as const;

const feedMeta: Record<
  FeedItem["type"],
  { icon: typeof Camera; color: string; bg: string }
> = {
  photo: { icon: Camera, color: "text-brand-600", bg: "bg-brand-50" },
  meal: { icon: Utensils, color: "text-[#0E9F6E]", bg: "bg-soft-green" },
  nap: { icon: Moon, color: "text-[#4C8BF5]", bg: "bg-soft-blue" },
  activity: { icon: Palette, color: "text-brand-600", bg: "bg-brand-50" },
  note: { icon: NotebookPen, color: "text-[#B76E00]", bg: "bg-soft-yellow" },
  checkin: { icon: LogIn, color: "text-[#0E9F6E]", bg: "bg-soft-green" },
  checkout: { icon: LogOut, color: "text-muted", bg: "bg-bg" },
  potty: { icon: Toilet, color: "text-[#4C8BF5]", bg: "bg-soft-blue" },
  learning: { icon: GraduationCap, color: "text-brand-700", bg: "bg-brand-50" },
};

export default function ActivityPage() {
  const [childId, setChildId] = useState("all");
  const [filter, setFilter] = useState<string>("all");
  const [items, setItems] = useState<FeedItem[]>(mockFeed);

  useEffect(() => {
    const ids = mockChildren.map((c) => c.id);
    fetchClassroomFeed(ids).then((live) => {
      if (live.length) setItems(live);
    });
  }, []);

  const list = useMemo(() => {
    return items.filter((item) => {
      const childOk = childId === "all" || item.childId === childId;
      const typeOk =
        filter === "all" ||
        item.type === filter ||
        (filter === "checkin" && (item.type === "checkin" || item.type === "checkout")) ||
        (filter === "activity" && (item.type === "activity" || item.type === "note"));
      return childOk && typeOk;
    });
  }, [items, childId, filter]);

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl lg:text-3xl">Activity</h1>
        <p className="mt-1 text-sm text-muted">Classroom updates logged by your child&apos;s teachers</p>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setChildId("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            childId === "all" ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
          )}
        >
          All kids
        </button>
        {mockChildren.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChildId(c.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              childId === c.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              filter === f.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {list.map((item) => {
          const meta = feedMeta[item.type];
          const Icon = meta.icon;
          return (
            <article key={item.id} className="rounded-2xl bg-surface p-3.5 shadow-card sm:p-4">
              <div className="flex items-start gap-3">
                <div className={cn("rounded-xl p-2", meta.bg)}>
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-heading sm:text-[15px]">{item.title}</p>
                      <p className="text-[11px] text-muted sm:text-xs">
                        {item.childName} · {item.time}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-xs text-heading/80 sm:text-sm">{item.body}</p>
                  {item.imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="max-h-48 w-full object-cover md:max-h-56"
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted md:col-span-2 xl:col-span-3">
            No activity for this filter yet.
          </p>
        )}
      </div>
    </div>
  );
}
