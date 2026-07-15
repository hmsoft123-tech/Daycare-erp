"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Baby,
  Camera,
  CheckCircle2,
  GraduationCap,
  Heart,
  Moon,
  NotebookPen,
  Palette,
  LogIn,
  LogOut,
  Toilet,
  Utensils,
  Lock,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { mockChildren, mockFeed, type FeedItem } from "@/data/mock";
import { useBillingStore } from "@/lib/billing-store";
import { cn } from "@kinder-pilot/ui";
import Link from "next/link";

const filters = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photos" },
  { id: "meal", label: "Meals" },
  { id: "nap", label: "Naps" },
  { id: "learning", label: "Learning" },
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

export default function ParentHomePage() {
  const isChildUnlocked = useBillingStore((s) => s.isChildUnlocked);
  const [childId, setChildId] = useState<string>("all");
  const [filter, setFilter] = useState<string>("all");
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>(() =>
    Object.fromEntries(mockFeed.map((f) => [f.id, { count: f.likes ?? 0, liked: !!f.liked }]))
  );

  const pendingChildren = mockChildren.filter(
    (c) => c.enrollmentStatus === "pending_first_payment" && !isChildUnlocked(c.id, c.enrollmentStatus)
  );
  const hasPendingPayment = pendingChildren.length > 0;
  const feedLocked = hasPendingPayment;

  const feed = useMemo(() => {
    return mockFeed.filter((item) => {
      const childOk = childId === "all" || item.childId === childId;
      const typeOk =
        filter === "all" ||
        item.type === filter ||
        (filter === "checkin" && (item.type === "checkin" || item.type === "checkout"));
      return childOk && typeOk;
    });
  }, [childId, filter]);

  const toggleLike = (id: string) => {
    setLikes((prev) => {
      const cur = prev[id] ?? { count: 0, liked: false };
      return {
        ...prev,
        [id]: cur.liked
          ? { count: Math.max(0, cur.count - 1), liked: false }
          : { count: cur.count + 1, liked: true },
      };
    });
  };

  return (
    <div className="space-y-4">
      {hasPendingPayment && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Enrollment pending — first payment required</p>
              <p className="mt-1 text-xs text-amber-800">
                {pendingChildren.map((c) => c.name).join(", ")} cannot access the full portal until the enrollment invoice is paid.
              </p>
              <Link
                href="/billing"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay invoice to unlock
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Brightwheel-style child switcher */}
      <section className="flex gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setChildId("all")}
          className={cn(
            "flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2",
            childId === "all" ? "bg-brand-50" : ""
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-2 bg-surface text-brand-500",
              childId === "all" ? "border-brand-500" : "border-transparent"
            )}
          >
            <Baby className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-semibold text-heading">All</span>
        </button>
        {mockChildren.map((child) => {
          const locked =
            child.enrollmentStatus === "pending_first_payment" &&
            !isChildUnlocked(child.id, child.enrollmentStatus);
          return (
            <button
              key={child.id}
              onClick={() => setChildId(child.id)}
              className={cn(
                "relative flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2",
                childId === child.id ? "bg-brand-50" : ""
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border-2 text-sm font-bold text-white",
                  childId === child.id ? "border-brand-500" : "border-transparent",
                  locked && "opacity-60"
                )}
                style={{ backgroundColor: child.photoColor }}
              >
                {child.initials}
              </div>
              {locked && (
                <Lock className="absolute right-1 top-1 h-3 w-3 text-amber-600" />
              )}
              <span className="max-w-[72px] truncate text-[11px] font-semibold text-heading">
                {child.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
        <Link
          href="/children"
          className="flex min-w-[72px] flex-col items-center gap-1.5 px-2 py-2"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-brand-300 bg-brand-50 text-xs font-bold text-brand-600">
            +
          </div>
          <span className="text-[11px] font-semibold text-muted">Profiles</span>
        </Link>
      </section>

      {/* Today strip */}
      <section className="rounded-2xl bg-surface p-3.5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Today&apos;s summary</p>
            <p className="mt-0.5 text-sm font-bold text-heading">
              {mockChildren.filter((c) => c.status === "checked_in").length} children checked in
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-soft-green px-2.5 py-1 text-[11px] font-bold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Live
          </div>
        </div>
      </section>

      {/* Activity filters */}
      <section className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === f.id
                ? "bg-brand-500 text-white"
                : "bg-surface text-muted shadow-card"
            )}
          >
            {f.label}
          </button>
        ))}
      </section>

      {/* Activity feed — locked when pending payment */}
      <section className="relative space-y-3">
        <h2 className="text-sm font-bold text-heading">Activity feed</h2>

        {feedLocked ? (
          <div className="relative overflow-hidden rounded-2xl">
            <div className="pointer-events-none select-none space-y-3 blur-sm">
              {feed.slice(0, +2).map((item) => (
                <div key={item.id} className="rounded-2xl bg-surface p-4 shadow-card">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-muted">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/80 p-6 text-center backdrop-blur-[2px]">
              <Lock className="h-8 w-8 text-amber-600" />
              <p className="mt-3 text-sm font-bold text-heading">Activity feed locked</p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Pay the enrollment invoice to unlock daily updates, photos, and messages.
              </p>
              <Link
                href="/billing"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
              >
                <CreditCard className="h-4 w-4" />
                Go to billing
              </Link>
            </div>
          </div>
        ) : (
          <>
            {feed.length === 0 && (
              <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
                <p className="text-sm font-semibold text-heading">No activities yet</p>
                <p className="mt-1 text-xs text-muted">Updates from school will appear here.</p>
              </div>
            )}
            <ul className="space-y-3">
              {feed.map((item, i) => {
                const meta = feedMeta[item.type];
                const Icon = meta.icon;
                const like = likes[item.id];
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.24) }}
                    className="overflow-hidden rounded-2xl bg-surface shadow-card"
                  >
                    <div className="flex items-center gap-3 px-3.5 pt-3.5">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", meta.bg, meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-heading">{item.title}</p>
                        <p className="text-[11px] text-muted">
                          {item.childName} · {item.time}
                        </p>
                      </div>
                    </div>

                    {item.imageUrl ? (
                      <div className="relative mt-3 aspect-[4/3] bg-bg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}

                    <div className="px-3.5 py-3">
                      <p className="text-sm leading-relaxed text-heading/85">{item.body}</p>
                      {item.type === "photo" && (
                        <button
                          onClick={() => toggleLike(item.id)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-muted"
                        >
                          <Heart
                            className={cn("h-3.5 w-3.5", like?.liked && "fill-brand-500 text-brand-500")}
                          />
                          {like?.count ?? 0}
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
