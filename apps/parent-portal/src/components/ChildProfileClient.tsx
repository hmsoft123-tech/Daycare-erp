"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Flower2,
  Lock,
  Moon,
  Shield,
  Utensils,
} from "lucide-react";
import { mockChildren, mockFeed } from "@/data/mock";
import { montessoriWorks, portfolioItems, type MontessoriStage } from "@/data/sdlc-parent";
import { cn } from "@kinder-pilot/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "myday", label: "My Day" },
  { id: "montessori", label: "Montessori" },
  { id: "attendance", label: "Attendance" },
  { id: "health", label: "Health" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reports", label: "Reports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const stageTone: Record<MontessoriStage, string> = {
  Presented: "bg-soft-blue text-[#006C9C]",
  Practising: "bg-soft-yellow text-[#B76E00]",
  "Developing Independence": "bg-brand-50 text-brand-700",
  Independent: "bg-soft-green text-success",
};

export function ChildProfileClient({ childId }: { childId: string }) {
  const search = useSearchParams();
  const initial = (search.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initial) ? initial : "overview");
  const [cctvOpen, setCctvOpen] = useState(false);

  const child = mockChildren.find((c) => c.id === childId);
  const works = useMemo(() => montessoriWorks.filter((w) => w.childId === childId), [childId]);
  const portfolio = useMemo(() => portfolioItems.filter((p) => p.childId === childId), [childId]);
  const dayItems = useMemo(
    () => mockFeed.filter((f) => f.childId === childId).slice(0, 6),
    [childId]
  );

  if (!child) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-heading">Child not found</p>
        <Link href="/children" className="mt-2 inline-block text-sm font-bold text-brand-600">
          Back to My children
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Link href="/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
        <ArrowLeft className="h-4 w-4" /> My children
      </Link>

      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ backgroundColor: child.photoColor }}
          >
            {child.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold text-heading">{child.name}</h1>
            <p className="text-xs text-muted">
              {child.className} · {child.program} · {child.ageLabel}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-success">
              {child.status === "checked_in" ? `Checked in · ${child.checkInTime}` : child.status}
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              tab === t.id ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <InfoRow label="Branch" value={child.branch} />
          <InfoRow label="Teacher" value={child.teacher} />
          <InfoRow label="G.R." value={child.grNumber ?? "—"} />
          <InfoRow label="Timings" value={child.timings ?? "—"} />
          <InfoRow label="Pickup" value={child.authorizedPickup?.join(" · ") ?? "—"} />
          <InfoRow label="Photo consent" value={child.photoConsent ? "Yes" : "No"} />
        </div>
      )}

      {tab === "myday" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setCctvOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3.5 text-left shadow-card"
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold text-heading">
              <Camera className="h-4 w-4 text-brand-600" /> View classroom camera
            </span>
            <span className="text-[11px] font-semibold text-muted">Demo · consent gated</span>
          </button>
          {dayItems.length === 0 && (
            <Empty title="No updates yet" body="Today’s care timeline will appear here." />
          )}
          {dayItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <p className="text-sm font-bold text-heading">{item.title}</p>
              <p className="mt-1 text-xs text-muted">
                {item.time} · {item.type}
              </p>
              <p className="mt-2 text-sm text-heading/85">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "montessori" && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Progress uses Montessori stages — not marks or percentages.
          </p>
          {works.length === 0 && <Empty title="No work presented yet" body="Learning areas will show here." />}
          {works.map((w) => (
            <div key={w.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{w.area}</p>
                  <p className="mt-0.5 text-sm font-bold text-heading">{w.material}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", stageTone[w.stage])}>
                  {w.stage}
                </span>
              </div>
              <p className="mt-2 text-sm text-heading/85">{w.observation}</p>
              <p className="mt-2 text-[11px] text-muted">Updated {w.updatedAt}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-3">
          <Link
            href="/school/attendance"
            className="block rounded-2xl bg-surface p-4 text-sm font-bold text-brand-600 shadow-card"
          >
            Open full attendance →
          </Link>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Present", value: "18", tone: "text-success" },
              { label: "Absent", value: "2", tone: "text-danger" },
              { label: "Late", value: "1", tone: "text-[#B76E00]" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface p-3 text-center shadow-card">
                <p className={cn("text-lg font-bold", s.tone)}>{s.value}</p>
                <p className="text-[11px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "health" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-heading">
              <AlertTriangle className="h-4 w-4 text-danger" /> Allergies
            </p>
            <p className="mt-2 text-sm text-muted">
              {child.allergies.length ? child.allergies.join(", ") : "None recorded"}
            </p>
          </div>
          <div className="rounded-2xl bg-surface p-4 shadow-card">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-heading">
              <Shield className="h-4 w-4 text-brand-600" /> Medication
            </p>
            <p className="mt-2 text-sm text-muted">No active medication authorizations.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Utensils, label: "Meals", value: "Lunch OK" },
              { icon: Moon, label: "Nap", value: "45 min" },
              { icon: CheckCircle2, label: "Wellness", value: "Good" },
            ].map((h) => (
              <div key={h.label} className="rounded-2xl bg-surface p-3 text-center shadow-card">
                <h.icon className="mx-auto h-4 w-4 text-brand-600" />
                <p className="mt-1 text-[11px] font-bold text-heading">{h.value}</p>
                <p className="text-[10px] text-muted">{h.label}</p>
              </div>
            ))}
          </div>
          <Link href="/school/incidents" className="block text-sm font-bold text-brand-600">
            View incident notices →
          </Link>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Developmental evidence curated by teachers — separate from Gallery photos.
          </p>
          {portfolio.length === 0 && (
            <Empty title="Portfolio empty" body="Observations and work samples will appear here." />
          )}
          {portfolio.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600">
                <Flower2 className="h-3.5 w-3.5" /> {p.area}
              </p>
              <p className="mt-1 text-sm font-bold text-heading">{p.title}</p>
              <p className="mt-1 text-sm text-heading/85">{p.note}</p>
              <p className="mt-2 text-[11px] text-muted">{p.date}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          <Link
            href="/school/progress"
            className="block rounded-2xl bg-surface p-4 text-sm font-bold text-brand-600 shadow-card"
          >
            Open progress reports →
          </Link>
          <Empty title="Term report" body="End-of-term report cards will appear when published by school." />
        </div>
      )}

      {cctvOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-lg">
            <div className="flex items-center gap-2 text-brand-600">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-bold">Classroom camera (demo)</p>
            </div>
            <p className="mt-2 text-xs text-muted">
              Access requires photo/video consent on file. Live stream is not connected in this demo —
              this screen shows the consent gate and placeholder player.
            </p>
            <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl bg-[#1C252E] text-sm font-semibold text-white/70">
              Camera preview unavailable
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCctvOpen(false)}
                className="flex-1 rounded-xl bg-bg py-2.5 text-sm font-bold text-heading"
              >
                Close
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white"
                onClick={() => setCctvOpen(false)}
              >
                Consent on file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-heading">{value}</span>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-surface p-6 text-center shadow-card">
      <p className="text-sm font-semibold text-heading">{title}</p>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </div>
  );
}
