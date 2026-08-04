import type { ServiceCategory, ServiceOffering, ServiceTier, StudentExtra } from "@/types";
import { CLASS_GROUPS, serviceOfferings } from "@/data/services";

export const SERVICE_CATEGORY_LABEL: Record<ServiceCategory, string> = {
  core_class: "Core classes",
  extra_care: "Extra care (Lite / Plus / Pro)",
  value_added: "Value-added (meals, Saturday, Quran)",
  after_school: "After-school care",
  learning: "Learning & tuition",
  recreational: "Recreational programs",
  registration: "Registration (outsiders)",
};

export function getServiceById(id: string): ServiceOffering | undefined {
  return serviceOfferings.find((s) => s.id === id);
}

export function servicesByCategory(
  category: ServiceCategory,
  activeOnly = true
): ServiceOffering[] {
  return serviceOfferings
    .filter((s) => s.category === category && (!activeOnly || s.active))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function coreClassForGroup(classGroup: string): ServiceOffering | undefined {
  return serviceOfferings.find(
    (s) => s.category === "core_class" && s.classGroup === classGroup && s.active
  );
}

export function afterSchoolPlan(tier: "lite" | "plus"): ServiceOffering | undefined {
  return serviceOfferings.find(
    (s) => s.category === "after_school" && s.tier === tier && s.active
  );
}

export function extraCareForTier(tier: ServiceTier): ServiceOffering | undefined {
  if (tier === "base") return undefined;
  return serviceOfferings.find(
    (s) => s.category === "extra_care" && s.tier === tier && s.active
  );
}

/** Monthly total for a class group + care tier (SDLC: base + extra care). */
export function planMonthlyTotal(classGroup: string, tier: ServiceTier): number {
  if (classGroup === "after_school") {
    const plan = afterSchoolPlan(tier === "pro" ? "plus" : tier === "base" ? "lite" : tier);
    return plan?.monthlyFee ?? 0;
  }
  const base = coreClassForGroup(classGroup);
  const care = extraCareForTier(tier);
  return (base?.monthlyFee ?? 0) + (care?.monthlyFee ?? 0);
}

export function planAdmissionFee(classGroup: string, tier: ServiceTier): number {
  if (classGroup === "after_school") {
    const plan = afterSchoolPlan(tier === "pro" ? "plus" : tier === "base" ? "lite" : tier);
    return plan?.admissionFee ?? 0;
  }
  return coreClassForGroup(classGroup)?.admissionFee ?? 0;
}

export function planLabel(classGroup: string, tier: ServiceTier): string {
  const group = CLASS_GROUPS.find((g) => g.id === classGroup)?.label ?? classGroup;
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  return `${group} — ${tierLabel}`;
}

/** Stable plan id stored on student.servicePlanId */
export function planId(classGroup: string, tier: ServiceTier): string {
  return `plan-${classGroup}-${tier}`;
}

export function parsePlanId(
  id?: string
): { classGroup: string; tier: ServiceTier } | null {
  if (!id?.startsWith("plan-")) return null;
  const rest = id.slice(5);
  const tiers: ServiceTier[] = ["base", "lite", "plus", "pro"];
  for (const tier of tiers) {
    if (rest.endsWith(`-${tier}`)) {
      return { classGroup: rest.slice(0, -(tier.length + 1)), tier };
    }
  }
  return null;
}

export function addonServices(activeOnly = true): ServiceOffering[] {
  return serviceOfferings
    .filter(
      (s) =>
        s.billableAsExtra &&
        s.category !== "extra_care" &&
        (!activeOnly || s.active)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Build student extras from selected catalogue add-on ids (+ care tier if not base). */
export function extrasFromSelection(
  classGroup: string,
  tier: ServiceTier,
  addOnIds: string[]
): StudentExtra[] {
  const extras: StudentExtra[] = [];
  if (classGroup !== "after_school") {
    const care = extraCareForTier(tier);
    if (care) {
      extras.push({
        id: `ex-${care.id}`,
        serviceId: care.id,
        label: care.name,
        amount: care.monthlyFee,
        kind: "addon",
        active: true,
        notes: care.description,
      });
    }
  }
  for (const id of addOnIds) {
    const svc = getServiceById(id);
    if (!svc) continue;
    const amount = svc.monthlyFee || svc.registrationFee || 0;
    extras.push({
      id: `ex-${svc.id}-${Date.now()}`,
      serviceId: svc.id,
      label: svc.name,
      amount,
      kind: svc.registrationFee && !svc.monthlyFee ? "charge" : "addon",
      active: true,
      notes: svc.schedule ?? svc.description,
    });
  }
  return extras;
}

export function classGroupLabel(id: string): string {
  return CLASS_GROUPS.find((g) => g.id === id)?.label ?? id;
}
