"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useCan } from "@/components/security/Can";
import { useTenantStore } from "@/lib/tenant-store";

/** `CompanyResponse` from `GET /hierarchy/companies` */
type ApiCompany = { id: number; name?: string | null; code?: string | null };

/**
 * `companyCode` for the fee endpoints (`/fees/structures/*`, `/fees/discounts`,
 * `/fees/calculate`) and `companyId` for monthly challans: the tenant id.
 *
 * The backend stores the tenant id as the company on inquiries and students, and
 * `calculate-fees` / `propose-fees` look fee rules up by the inquiry's company (they
 * take no company code), so rules saved under the Head Office code are never found
 * (verified 2026-10-28). The Head Office record only supplies the display name.
 */
export function useCompanyCode(): {
  companyCode: string;
  isLoading: boolean;
  /** False until the signed-in tenant is known */
  resolved: boolean;
  companyName?: string;
} {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  // The display name is optional and the company list is admin-only (403 for other roles).
  const canReadCompany = useCan("settings.manage");
  const { data } = useQuery({
    queryKey: ["company", tenantId],
    queryFn: () => api.get<ApiCompany[]>("/hierarchy/companies"),
    enabled: !!tenantId && canReadCompany,
    staleTime: 10 * 60_000,
    retry: 0,
  });
  return {
    companyCode: tenantId,
    isLoading: false,
    resolved: !!tenantId,
    companyName: data?.[0]?.name ?? undefined,
  };
}
