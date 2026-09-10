"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Cake,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  Package,
  Receipt,
  ShieldAlert,
  UserCog,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALERTS = [
  { icon: CalendarDays, label: "Upcoming events", detail: "Sports day · Fri 10:00", href: "/communications" },
  { icon: Receipt, label: "Fee defaulters", detail: "12 families · 60+ days overdue", href: "/billing" },
  { icon: Package, label: "Low stock alerts", detail: "3 course items below reorder", href: "/inventory/stock" },
  { icon: UserCog, label: "Staff notifications", detail: "2 leave requests pending", href: "/hr/leave" },
  { icon: Cake, label: "Child birthdays", detail: "Today & upcoming (4)", href: "/students" },
  { icon: Cake, label: "Staff birthdays", detail: "This week (2)", href: "/hr/staff" },
  { icon: ClipboardList, label: "Pending admissions", detail: "Inquiries awaiting follow-up", href: "/admissions" },
  { icon: MessageSquare, label: "New messages", detail: "5 unread parent threads", href: "/communications" },
  { icon: ShieldAlert, label: "Pending approvals", detail: "HO fee locks · 3", href: "/billing/fee-locks" },
  { icon: AlertTriangle, label: "Open incidents", detail: "1 ABC follow-up", href: "/incidents" },
  { icon: ClipboardList, label: "Pending follow-ups", detail: "Inquiry stage 2 · 4 leads", href: "/admissions" },
  { icon: Wrench, label: "Maintenance alerts", detail: "AC service due · NN", href: "/maintenance" },
] as const;

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative rounded-full bg-surface p-2.5 text-muted shadow-card transition hover:text-heading"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_rgba(28,37,46,0.16)]"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-heading">Notifications</p>
            <p className="text-[11px] text-muted">FE review alert categories · demo</p>
          </div>
          <ul className="max-h-[min(70vh,24rem)] overflow-y-auto py-1">
            {ALERTS.map((a) => (
              <li key={a.label}>
                <Link
                  href={a.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-2.5 text-sm transition hover:bg-bg"
                  )}
                >
                  <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-heading">{a.label}</span>
                    <span className="block text-xs text-muted">{a.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
