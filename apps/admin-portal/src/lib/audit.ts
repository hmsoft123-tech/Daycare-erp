/**
 * System-wide "Last Updated" tracking.
 * Every create / edit should call `stamp()` and store the result on the record,
 * and every record view should render <LastUpdated stamp={...} />.
 */

import { format, isValid, parseISO } from "date-fns";
import { useTenantStore } from "@/lib/tenant-store";
import type { AuditStamp } from "@/types";

const FALLBACK_USER = "Admin";

/** Signed-in user's display name (server renders fall back to "Admin"). */
export function currentUserName(): string {
  try {
    return useTenantStore.getState().userName?.trim() || FALLBACK_USER;
  } catch {
    return FALLBACK_USER;
  }
}

/** Fresh stamp for a create / edit happening now. */
export function stamp(by?: string): AuditStamp {
  return { updatedAt: new Date().toISOString(), updatedBy: by?.trim() || currentUserName() };
}

/** Seed helper — `seedStamp("2026-09-20 10:15", "Hina Tariq")`. */
export function seedStamp(localDateTime: string, updatedBy: string): AuditStamp {
  return { updatedAt: localDateTime.replace(" ", "T") + ":00", updatedBy };
}

/** "23 September 2026" — falls back to the raw value if it isn't a valid date */
export function formatStampDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMMM yyyy") : iso;
}

/** "11:20 AM" — date-only values have no meaningful time. */
export function formatStampTime(iso: string): string | null {
  if (!iso.includes("T")) return null;
  const d = parseISO(iso);
  return isValid(d) ? format(d, "h:mm a") : null;
}

/** "23 September 2026, 11:20 AM" */
export function formatStamp(iso: string): string {
  const time = formatStampTime(iso);
  return time ? `${formatStampDate(iso)}, ${time}` : formatStampDate(iso);
}

/** Most recent of several stamps (e.g. a list's overall last edit). */
export function latestStamp(stamps: (AuditStamp | undefined)[]): AuditStamp | undefined {
  return stamps
    .filter((s): s is AuditStamp => !!s)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
}
