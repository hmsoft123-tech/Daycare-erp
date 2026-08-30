"use client";

import { useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { mockChildren } from "@/data/mock";

const formTabs = [
  { id: "feedback", label: "Feedback" },
  { id: "complaint", label: "Complaint" },
  { id: "absence", label: "Absence / late pickup" },
  { id: "consent", label: "Consent" },
  { id: "aid", label: "Financial assistance" },
] as const;

type Tab = (typeof formTabs)[number]["id"];

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>("feedback");
  const [childId, setChildId] = useState(mockChildren[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Requests & Support</h1>
        <p className="mt-1 text-sm text-muted">Submit feedback, absences, consents, and support requests</p>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {formTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setDone(false);
            }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold",
              tab === t.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-card space-y-3">
        <label className="block text-xs font-semibold text-muted">
          Child
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2.5 text-sm text-heading"
          >
            {mockChildren.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-muted">
          Details
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2.5 text-sm text-heading"
            placeholder="Describe your request…"
          />
        </label>
        {done ? (
          <p className="rounded-xl bg-soft-green px-3 py-2 text-sm font-semibold text-success">
            Request submitted (demo) — school will follow up.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setDone(true)}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white"
          >
            Submit request
          </button>
        )}
      </div>
    </div>
  );
}
