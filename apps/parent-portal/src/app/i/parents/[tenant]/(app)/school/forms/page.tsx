"use client";

import { useState } from "react";
import { cn } from "@kinder-pilot/ui";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";
import { mockChildren } from "@/data/mock";

const formTabs = [
  { id: "feedback", label: "Feedback" },
  { id: "complaint", label: "Complaint / suggestion" },
  { id: "service", label: "Service form" },
  { id: "consent", label: "Parent consent" },
  { id: "aid", label: "Financial assistance" },
] as const;

type Tab = (typeof formTabs)[number]["id"];

export default function FormsPage() {
  const [tab, setTab] = useState<Tab>("feedback");
  const [childId, setChildId] = useState(mockChildren[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="Parent forms"
        subtitle="Feedback, complaints, service changes, consent & financial aid"
      />

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
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              tab === t.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {done && (
        <p className="rounded-xl bg-soft-green px-3 py-2 text-xs font-semibold text-[#0E9F6E]">
          Submitted to branch — office will review per SDLC timelines.
        </p>
      )}

      <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-card">
        <label className="block text-xs font-semibold text-muted">
          Child
          <select
            className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2 text-sm font-semibold text-heading"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            {mockChildren.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.grNumber}
              </option>
            ))}
          </select>
        </label>

        {tab === "feedback" && (
          <p className="text-xs text-muted">
            Bi-annual feedback (security, reception, cleanliness, fees, teachers) — short portal
            version; full checklist at branch.
          </p>
        )}
        {tab === "complaint" && (
          <p className="text-xs text-muted">
            Non-urgent: review in 2 working days · Urgent: 1–2 days. Also email your branch.
          </p>
        )}
        {tab === "service" && (
          <p className="text-xs text-muted">
            Service changes apply from the 1st or 15th (Lite / Plus / Pro, meal, tuition).
          </p>
        )}
        {tab === "consent" && (
          <p className="text-xs text-muted">
            Preparatory system & targeted school consent (Parent Consent Form).
          </p>
        )}
        {tab === "aid" && (
          <p className="text-xs text-muted">
            Financial Aid or Zakat program — limited seats; submit supporting docs at branch.
          </p>
        )}

        <label className="block text-xs font-semibold text-muted">
          Callback number
          <input
            className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2 text-sm text-heading"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="03xx-xxxxxxx"
          />
        </label>

        <label className="block text-xs font-semibold text-muted">
          Details
          <textarea
            className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2 text-sm text-heading"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setDone(true);
            setBody("");
          }}
          disabled={!body.trim()}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit to school
        </button>
      </div>
    </div>
  );
}
