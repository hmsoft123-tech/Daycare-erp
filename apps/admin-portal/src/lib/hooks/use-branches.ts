"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type { ApiBranch } from "@/lib/branch-staff-api";
import { Roles } from "@/lib/rbac";
import { useTenantStore } from "@/lib/tenant-store";

/** A branch for dropdowns: `code` is what the API's `branchId` / `branchCode` params expect. */
export type BranchOption = { id: string; code: string; name: string };

/**
 * The signed-in user's branches from the login response (`branchIds: BranchDto[]`).
 * Older sessions without names fall back to the company list (`GET /hierarchy/branches`).
 */
export function useBranches(): { branches: BranchOption[]; isLoading: boolean } {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const sessionBranches = useTenantStore((s) => s.branches);

  const { data, isLoading } = useQuery({
    queryKey: ["branches", tenantId],
    queryFn: () => api.get<ApiBranch[]>("/hierarchy/branches"),
    enabled: sessionBranches.length === 0 && !!tenantId,
    staleTime: 5 * 60_000,
  });

  if (sessionBranches.length) return { branches: sessionBranches, isLoading: false };
  const branches = (data ?? []).map((b) => {
    const code = b.code || String(b.id);
    return { id: String(b.id), code, name: b.name || code };
  });
  return { branches, isLoading };
}

const COMPANY_WIDE_ROLES: string[] = [
  Roles.SuperAdmin,
  Roles.PlatformAdmin,
  Roles.CompanyAdmin,
  Roles.Admin,
  Roles.Accountant,
  Roles.FinanceAdmin,
];

/**
 * `branchId` filters for `GET /students`, or null for none: the API does not limit
 * that list for branch admins, so they ask for their own branches explicitly.
 */
export function useStudentBranchFilters(): string[] | null {
  const { branches } = useBranches();
  const roles = useTenantStore((s) => s.roles);
  const branchOnly = roles.includes(Roles.BranchAdmin) && !roles.some((r) => COMPANY_WIDE_ROLES.includes(r));
  return branchOnly && branches.length ? branches.map((b) => b.code) : null;
}

/** Display name for a branch code (or id), falling back to the code itself. */
export function branchLabel(branches: BranchOption[], codeOrId: string | null | undefined): string {
  if (!codeOrId) return "—";
  return branches.find((b) => b.code === codeOrId || b.id === codeOrId)?.name ?? codeOrId;
}
