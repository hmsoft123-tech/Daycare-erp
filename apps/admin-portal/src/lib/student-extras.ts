import type { StudentExtra } from "@/types";
import { addonServices, extraCareForTier } from "@/lib/services-catalog";
import type { ServiceTier } from "@/types";

/** Preset extras from SDLC services catalogue (plus learning / recreational) */
export const STUDENT_EXTRA_PRESETS: Omit<StudentExtra, "id" | "active">[] = [
  ...addonServices().map((s) => ({
    label: s.name,
    amount: s.monthlyFee || s.registrationFee || 0,
    kind: (s.registrationFee && !s.monthlyFee ? "charge" : "addon") as StudentExtra["kind"],
    notes: s.schedule ?? s.description,
    serviceId: s.id,
  })),
  // Keep common benefits (not on fee sheet)
  { label: "Sibling Benefit Discount", amount: -2000, kind: "benefit", notes: "Credit applied on invoice" },
  { label: "Staff Child Benefit", amount: -5000, kind: "benefit", notes: "Staff discount credit" },
  { label: "Scholarship Benefit", amount: -3000, kind: "benefit" },
];

/** Extra care Lite/Plus/Pro as presets when attaching manually */
export function careTierPresets(): Omit<StudentExtra, "id" | "active">[] {
  return (["lite", "plus", "pro"] as ServiceTier[])
    .map((tier) => extraCareForTier(tier))
    .filter(Boolean)
    .map((s) => ({
      label: s!.name,
      amount: s!.monthlyFee,
      kind: "addon" as const,
      notes: s!.description,
      serviceId: s!.id,
    }));
}

export function activeExtrasTotal(extras?: StudentExtra[]): number {
  if (!extras?.length) return 0;
  return extras.filter((e) => e.active).reduce((sum, e) => sum + e.amount, 0);
}

export function activeExtras(extras?: StudentExtra[]): StudentExtra[] {
  return (extras ?? []).filter((e) => e.active);
}
