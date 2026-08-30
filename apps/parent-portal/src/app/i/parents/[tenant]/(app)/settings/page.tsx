"use client";

import { useState } from "react";
import { cn } from "@kinder-pilot/ui";

export default function ParentSettingsPage() {
  const [push, setPush] = useState(true);
  const [photoConsent, setPhotoConsent] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-4 md:space-y-6">
      <section>
        <h1 className="font-heading text-xl font-bold text-heading md:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Notifications, consent, and account preferences</p>
      </section>

      <Toggle label="Push notifications" hint="Messages, check-in, and alerts" on={push} onChange={setPush} />
      <Toggle label="Email alerts" hint="Fee reminders and circulars" on={emailAlerts} onChange={setEmailAlerts} />
      <Toggle
        label="Photo & video consent"
        hint="Allow classroom photos in Gallery and camera access"
        on={photoConsent}
        onChange={setPhotoConsent}
      />

      <div className="rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-sm font-bold text-heading">Language</p>
        <p className="mt-1 text-xs text-muted">English (Pakistan) · demo</p>
      </div>
      <div className="rounded-2xl bg-surface p-4 shadow-card">
        <p className="text-sm font-bold text-heading">Password</p>
        <p className="mt-1 text-xs text-muted">Change password is disabled in demo login.</p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3.5 text-left shadow-card"
    >
      <div>
        <p className="text-sm font-bold text-heading">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <span className={cn("relative h-6 w-11 rounded-full transition", on ? "bg-brand-500" : "bg-black/15")}>
        <span
          className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition", on ? "left-5" : "left-0.5")}
        />
      </span>
    </button>
  );
}
