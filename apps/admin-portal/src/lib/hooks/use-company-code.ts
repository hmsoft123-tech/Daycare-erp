"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useTenantStore } from "@/lib/tenant-store";

/** `CompanyResponse` from `GET /hierarchy/companies` */
type ApiCompany = { id: number; name?: string | null; code?: string | null };

/**
 * `companyCode` for the fee endpoints (`/fees/structures/*`, `/fees/discounts`):
 * the tenant's company code, or the tenant id while it loads / if it cannot be read.
 */
export function useCompanyCode(): {
  companyCode: string;
  isLoading: boolean;
  /** True when the code came from the Head Office record, not the tenant-id fallback */
  resolved: boolean;
  companyName?: string;
} {
  const api = useApiClient();
  const tenantId = useTenantStore((s) => s.tenantId) ?? "";
  const { data, isLoading } = useQuery({
    queryKey: ["company", tenantId],
    queryFn: () => api.get<ApiCompany[]>("/hierarchy/companies"),
    enabled: !!tenantId,
    staleTime: 10 * 60_000,
    retry: 0,
  });
  const company = data?.[0];
  return {
    companyCode: company?.code || tenantId,
    isLoading,
    resolved: !!company?.code,
    companyName: company?.name ?? undefined,
  };
}
