"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, MapPin, UserRound } from "lucide-react";
import { mockChildren } from "@/data/mock";

export default function ParentChildrenPage() {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading">My children</h1>
        <p className="mt-1 text-sm text-muted">Profiles, classrooms, and health notes</p>
      </section>

      <ul className="space-y-3">
        {mockChildren.map((child) => (
          <li key={child.id}>
            <Link
              href="/home"
              className="block overflow-hidden rounded-2xl bg-surface shadow-card transition hover:shadow-[0_8px_28px_rgba(31,41,51,0.1)]"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: child.photoColor }}
                >
                  {child.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-heading">{child.name}</p>
                  <p className="text-xs text-muted">
                    {child.className} · {child.ageLabel}
                  </p>
                  {child.checkInTime && (
                    <p className="mt-1 text-[11px] font-semibold text-success">
                      Checked in · {child.checkInTime}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </div>

              <div className="space-y-2 border-t border-black/[0.04] px-4 py-3">
                {child.allergies.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-soft-red px-2.5 py-2 text-xs font-semibold text-danger">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Allergy: {child.allergies.join(", ")}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" /> {child.branch}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5 text-brand-500" /> {child.teacher}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
