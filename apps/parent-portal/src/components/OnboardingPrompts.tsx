"use client";

import { useEffect, useState } from "react";
import { fetchParentOps, postParentOps } from "@/lib/parent-ops-api";
import type { ParentChild } from "@/data/mock";

type MandatoryFormKind = "pick_drop_details" | "parent_consent";

type MandatoryForm = {
  id: string;
  childId: string;
  kind: MandatoryFormKind;
  status: "pending" | "submitted";
  values: Record<string, string>;
};

const FORM_LABELS: Record<MandatoryFormKind, string> = {
  pick_drop_details: "Pick & Drop Details",
  parent_consent: "Parent Consent Form",
};

const FORM_FIELDS: Record<MandatoryFormKind, { key: string; label: string }[]> = {
  pick_drop_details: [
    { key: "dropOffTime", label: "Usual drop-off time" },
    { key: "pickUpTime", label: "Usual pick-up time" },
    { key: "authorizedPickup", label: "Authorized pickup person(s)" },
  ],
  parent_consent: [
    { key: "guardianName", label: "Parent / guardian name" },
    { key: "consentDate", label: "Date" },
  ],
};

const DAYCARE_SEEN_KEY = "kp-daycare-window-seen";

export function OnboardingPrompts() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [forms, setForms] = useState<MandatoryForm[]>([]);
  const [activeForm, setActiveForm] = useState<MandatoryForm | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [daycareDismissed, setDaycareDismissed] = useState(true);

  const load = () => {
    void fetchParentOps<ParentChild>("children", []).then(setChildren);
    void fetchParentOps<MandatoryForm>("mandatoryForms", []).then(setForms);
  };

  useEffect(load, []);

  useEffect(() => {
    try {
      setDaycareDismissed(sessionStorage.getItem(DAYCARE_SEEN_KEY) === "1");
    } catch {
      setDaycareDismissed(false);
    }
  }, []);

  const pendingForms = forms.filter((f) => f.status === "pending");
  const daycareChild = !daycareDismissed ? children.find((c) => c.daycareTrack) : undefined;

  const openForm = (form: MandatoryForm) => {
    setActiveForm(form);
    setFieldValues({});
  };

  const submitForm = async () => {
    if (!activeForm) return;
    setSubmitting(true);
    const ok = await postParentOps({
      action: "submitMandatoryForm",
      childId: activeForm.childId,
      kind: activeForm.kind,
      values: fieldValues,
    });
    setSubmitting(false);
    if (!ok) return;
    setActiveForm(null);
    load();
  };

  const dismissDaycare = () => {
    setDaycareDismissed(true);
    try {
      sessionStorage.setItem(DAYCARE_SEEN_KEY, "1");
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
  };

  return (
    <>
      {pendingForms.length > 0 && !activeForm && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Complete required forms</p>
          <p className="mt-1 text-xs text-amber-800">
            Please finish these forms so we have complete records for your child.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingForms.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => openForm(f)}
                className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white"
              >
                {FORM_LABELS[f.kind]}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-lg">
            <p className="text-sm font-bold text-heading">{FORM_LABELS[activeForm.kind]}</p>
            <div className="mt-3 space-y-3">
              {FORM_FIELDS[activeForm.kind].map((field) => (
                <label key={field.key} className="block text-xs font-semibold text-muted">
                  {field.label}
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 bg-bg px-3 py-2 text-sm text-heading"
                    value={fieldValues[field.key] ?? ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-heading"
                  onClick={() => setActiveForm(null)}
                >
                  Later
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  onClick={() => void submitForm()}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {daycareChild && !activeForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-lg">
            <p className="text-sm font-bold text-heading">Daycare enrolment — {daycareChild.name}</p>
            <p className="mt-2 text-xs text-muted">
              {daycareChild.name} is enrolled in daycare services. Please complete the Pick &amp; Drop
              Details form above and review drop-off / pick-up arrangements with your branch coordinator.
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="w-full rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white"
                onClick={dismissDaycare}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
