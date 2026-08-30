"use client";

import Link from "next/link";
import { familyMembers } from "@/data/sdlc-parent";
import { mockChildren } from "@/data/mock";

export default function FamilyPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">My Family</h1>
        <p className="mt-1 text-sm text-muted">Guardians and authorized pickup — separate from child profiles</p>
      </section>

      <ul className="space-y-3">
        {familyMembers.map((m) => (
          <li key={m.id} className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="text-sm font-bold text-heading">{m.name}</p>
            <p className="text-xs text-muted">{m.role}</p>
            <p className="mt-2 text-xs text-heading">{m.phone}</p>
            <p className="text-xs text-muted">{m.email}</p>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-sm font-bold text-heading">Linked children</p>
        <ul className="mt-3 space-y-2">
          {mockChildren.map((c) => (
            <li key={c.id}>
              <Link href={`/children/${c.id}`} className="text-sm font-semibold text-brand-600">
                {c.name} · {c.className}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
