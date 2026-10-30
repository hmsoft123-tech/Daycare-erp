"use client";

import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

/**
 * Branches and programs for the public inquiry form. The only unauthenticated
 * source is the company's website widget (`/public/widget/{publicKey}/…`), so the
 * shareable link carries the widget key as `?key=`. Without one (or if the widget
 * is off or this site is not on its allowed list) no branches are offered, never made-up ones.
 */

/** `BranchResponse` */
type ApiPublicBranch = { id: number; code?: string | null; name?: string | null; city?: string | null };
/** `ProgramResponse` */
type ApiPublicProgram = { id: number; name?: string | null; ageGroupOrGrade?: string | null };

/** `value` is what the inquiry stores as its branch (the branch code). */
export type PublicBranchOption = { id: string; value: string; label: string };

export const FALLBACK_PROGRAMS = ["Daycare", "Preschool", "Kindergarten", "After School", "Therapy Services"];

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function usePublicFormOptions(publicKey: string | null, branchValue: string | undefined) {
  const key = publicKey && KEY_PATTERN.test(publicKey) ? publicKey : null;
  const [branches, setBranches] = useState<PublicBranchOption[] | null>(null);
  const [programs, setPrograms] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(!!key);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    publicApi
      .get<ApiPublicBranch[]>(`/widget/${key}/branches`)
      .then((list) => {
        if (cancelled) return;
        const options = (list ?? []).map((b) => ({
          id: String(b.id),
          value: b.code || String(b.id),
          label: [b.name || b.code || `Branch ${b.id}`, b.city].filter(Boolean).join(" · "),
        }));
        setBranches(options.length ? options : null);
      })
      .catch(() => {
        if (!cancelled) setBranches(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Programs are offered per branch.
  const branchId = branches?.find((b) => b.value === branchValue)?.id;
  useEffect(() => {
    setPrograms(null);
    if (!key || !branchId) return;
    let cancelled = false;
    publicApi
      .get<ApiPublicProgram[]>(`/widget/${key}/branches/${encodeURIComponent(branchId)}/programs`)
      .then((list) => {
        if (cancelled) return;
        const names = [...new Set((list ?? []).map((p) => p.name?.trim()).filter((n): n is string => !!n))];
        setPrograms(names.length ? names : null);
      })
      .catch(() => {
        if (!cancelled) setPrograms(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, branchId]);

  const live = !!branches;
  return {
    branches: branches ?? [],
    // Live lists: pick the branch first; a branch with no programs listed gets the defaults.
    programs: !live ? FALLBACK_PROGRAMS : !branchId ? [] : (programs ?? FALLBACK_PROGRAMS),
    /** True when the lists came from the API */
    live,
    /** The branch lookup is still running */
    loading,
  };
}
