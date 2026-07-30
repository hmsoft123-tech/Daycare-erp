import { EMPLOYEE_FILE_SLOTS, type EmployeeFileSlotDef } from "@/data/employee-file";
import type { EmployeeFileEntry, EmployeeFileSlotKey, Staff } from "@/types";

export function slotsForPublicHire(): EmployeeFileSlotDef[] {
  return EMPLOYEE_FILE_SLOTS.filter((s) => s.phase === "hire" && s.publicVisible);
}

export function slotsForAdminHire(): EmployeeFileSlotDef[] {
  return EMPLOYEE_FILE_SLOTS.filter((s) => s.phase === "hire");
}

export function slotsForAdminFull(): EmployeeFileSlotDef[] {
  return EMPLOYEE_FILE_SLOTS;
}

export function requiredHireSlots(mode: "public" | "admin"): EmployeeFileSlotDef[] {
  const pool = mode === "public" ? slotsForPublicHire() : slotsForAdminHire();
  return pool.filter((s) => s.requiredOnHire);
}

export function emptyEmployeeFile(): EmployeeFileEntry[] {
  return EMPLOYEE_FILE_SLOTS.map((s) => ({ key: s.key, received: false }));
}

export function mergeEmployeeFile(
  existing: EmployeeFileEntry[] | undefined,
  patch: Partial<Record<EmployeeFileSlotKey, Partial<EmployeeFileEntry>>>
): EmployeeFileEntry[] {
  const base = existing?.length ? [...existing] : emptyEmployeeFile();
  const map = new Map(base.map((e) => [e.key, { ...e }]));
  for (const [key, value] of Object.entries(patch) as [
    EmployeeFileSlotKey,
    Partial<EmployeeFileEntry>,
  ][]) {
    const prev = map.get(key) ?? { key, received: false };
    map.set(key, { ...prev, ...value, key });
  }
  // Preserve catalog order
  return EMPLOYEE_FILE_SLOTS.map(
    (s) => map.get(s.key) ?? { key: s.key, received: false }
  );
}

export function entryMap(
  file: EmployeeFileEntry[] | undefined
): Record<EmployeeFileSlotKey, EmployeeFileEntry> {
  const out = {} as Record<EmployeeFileSlotKey, EmployeeFileEntry>;
  for (const s of EMPLOYEE_FILE_SLOTS) {
    out[s.key] = { key: s.key, received: false };
  }
  for (const e of file ?? []) {
    out[e.key] = e;
  }
  return out;
}

export function missingRequiredHire(
  file: EmployeeFileEntry[] | undefined,
  mode: "public" | "admin"
): EmployeeFileSlotDef[] {
  const map = entryMap(file);
  return requiredHireSlots(mode).filter((s) => !map[s.key]?.received);
}

export function isProbationComplete(member: Pick<Staff, "probationCompleted" | "probationEndDate">): boolean {
  if (member.probationCompleted) return true;
  if (!member.probationEndDate) return false;
  return new Date(member.probationEndDate).getTime() <= Date.now();
}

/** Slots admin may edit on staff profile given probation state */
export function canEditSlot(
  slot: EmployeeFileSlotDef,
  member: Pick<Staff, "probationCompleted" | "probationEndDate">
): boolean {
  // Hire docs + exit paperwork can be updated anytime
  if (slot.phase === "hire" || slot.phase === "exit") return true;
  // Post-probation & ongoing (promotion, salary revision, evaluations) after probation
  return isProbationComplete(member);
}

export function phaseLabel(phase: EmployeeFileSlotDef["phase"]): string {
  switch (phase) {
    case "hire":
      return "At hiring";
    case "post_probation":
      return "After probation";
    case "ongoing":
      return "Ongoing employment";
    case "exit":
      return "Exit";
  }
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
