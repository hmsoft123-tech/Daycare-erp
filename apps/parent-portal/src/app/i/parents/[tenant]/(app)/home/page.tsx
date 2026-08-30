"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Baby,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Flower2,
  Images,
  LifeBuoy,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { mockChildren, mockInvoices } from "@/data/mock";
import { galleryItems, montessoriWorks } from "@/data/sdlc-parent";
import { useBillingStore } from "@/lib/billing-store";
import { cn } from "@kinder-pilot/ui";

const quickActions = [
  { href: "/messages", label: "Message", icon: MessageSquare },
  { href: "/billing", label: "Pay fees", icon: CreditCard },
  { href: "/requests", label: "Request", icon: LifeBuoy },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/activity", label: "Today", icon: Sparkles },
] as const;

export default function ParentHomePage() {
  const isChildUnlocked = useBillingStore((s) => s.isChildUnlocked);
  const selected = mockChildren.find((c) => c.status === "checked_in") ?? mockChildren[0];
  const pendingChildren = mockChildren.filter(
    (c) => c.enrollmentStatus === "pending_first_payment" && !isChildUnlocked(c.id, c.enrollmentStatus)
  );
  const upcomingFee = mockInvoices.find((i) => i.status === "pending" || i.status === "overdue");
  const montessori = montessoriWorks.find((w) => w.childId === selected?.id) ?? montessoriWorks[0];
  const latestPhoto = galleryItems[0];

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-2xl font-bold text-heading lg:text-3xl">Home</h1>
        <p className="mt-1 text-sm text-muted">Priority updates for your family</p>
      </section>

      {pendingChildren.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Action required</p>
              <p className="mt-1 text-xs text-amber-800">
                First payment pending for {pendingChildren.map((c) => c.name).join(", ")}.
              </p>
              <Link
                href="/billing"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Complete payment
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Selected child + status */}
      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: selected.photoColor }}
          >
            {selected.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-heading">{selected.name}</p>
            <p className="text-xs text-muted">
              {selected.className} · {selected.branch}
            </p>
            <p
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-[11px] font-semibold",
                selected.status === "checked_in" ? "text-success" : "text-muted"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {selected.status === "checked_in"
                ? `At school · checked in ${selected.checkInTime ?? ""}`
                : selected.status === "absent"
                  ? "Marked absent today"
                  : "Pickup pending"}
            </p>
          </div>
          <Link href={`/children/${selected.id}`} className="text-xs font-bold text-brand-600">
            Profile
          </Link>
        </div>
      </section>

      {/* Today summary */}
      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Today&apos;s summary</p>
        <p className="mt-1 text-sm font-bold text-heading">
          {mockChildren.filter((c) => c.status === "checked_in").length} of {mockChildren.length} children
          on site
        </p>
        <p className="mt-1 text-xs text-muted">Meals, naps, and learning updates are in Activity.</p>
        <Link href="/activity" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
          Open today&apos;s timeline <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Montessori teaser */}
        <section className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-600">
            <Flower2 className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Latest Montessori</p>
          </div>
          <p className="mt-2 text-sm font-bold text-heading">{montessori.material}</p>
          <p className="mt-0.5 text-xs text-muted">
            {montessori.area} · {montessori.stage}
          </p>
          <Link
            href={`/children/${montessori.childId}?tab=montessori`}
            className="mt-2 inline-flex text-xs font-bold text-brand-600"
          >
            View learning areas
          </Link>
        </section>

        {/* Message preview */}
        <section className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-600">
            <MessageSquare className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Recent message</p>
          </div>
          <p className="mt-2 text-sm font-bold text-heading">PTM slots open next week</p>
          <p className="mt-0.5 text-xs text-muted">From Infant Room A · yesterday</p>
          <Link href="/messages" className="mt-2 inline-flex text-xs font-bold text-brand-600">
            Open messages
          </Link>
        </section>

        {/* Upcoming fee / event */}
        <section className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-600">
            <CreditCard className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Upcoming fee</p>
          </div>
          {upcomingFee ? (
            <>
              <p className="mt-2 text-sm font-bold text-heading">
                {upcomingFee.plan} · Rs {upcomingFee.amount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Due {upcomingFee.dueDate} · {upcomingFee.childName}
              </p>
              <Link href="/billing" className="mt-2 inline-flex text-xs font-bold text-brand-600">
                View fees
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No fees due</p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-brand-600">
            <Camera className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Gallery</p>
          </div>
          <p className="mt-2 text-sm font-bold text-heading">{latestPhoto.caption}</p>
          <p className="mt-0.5 text-xs text-muted">
            {latestPhoto.childName} · {latestPhoto.time}
          </p>
          <Link href="/gallery" className="mt-2 inline-flex text-xs font-bold text-brand-600">
            Open gallery
          </Link>
        </section>
      </div>

      {/* Quick actions */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Quick actions</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-center shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold text-heading">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Baby className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-semibold text-heading">Open a child profile</p>
        </div>
        <Link href="/children" className="text-xs font-bold text-brand-600">
          My children →
        </Link>
      </section>
    </div>
  );
}
