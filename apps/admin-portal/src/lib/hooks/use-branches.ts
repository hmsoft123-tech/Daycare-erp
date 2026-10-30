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
 * `branchId` values to query for a board or queue, or null for no filter. Records
 * filed through the website widget store the branch's numeric id, others its code,
 * so both are asked for. Branch admins always query their own branches: the backend
 * only defaults them to the code, which hides website records.
 */
export function useBranchQueryValues(selected?: string | null): string[] | null {
  const { branches } = useBranches();
  const roles = useTenantStore((s) => s.roles);
  const keys = (b: BranchOption) => [b.code, b.id];
  if (selected) {
    const match = branches.find((b) => b.code === selected || b.id === selected);
    return match ? [...new Set(keys(match))] : [selected];
  }
  const branchOnly = roles.includes(Roles.BranchAdmin) && !roles.some((r) => COMPANY_WIDE_ROLES.includes(r));
  return branchOnly && branches.length ? [...new Set(branches.flatMap(keys))] : null;
}

/** Display name for a branch code (or id), falling back to the code itself. */
export function branchLabel(branches: BranchOption[], codeOrId: string | null | undefined): string {
  if (!codeOrId) return "—";
  return branches.find((b) => b.code === codeOrId || b.id === codeOrId)?.name ?? codeOrId;
}
