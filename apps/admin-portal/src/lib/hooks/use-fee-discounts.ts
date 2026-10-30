"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type { ApiFeeDiscount } from "@/lib/admissions-api";

/** Discounts usable at a branch: the API returns company-wide rows plus the branch's own. */
export function useFeeDiscounts<T extends ApiFeeDiscount = ApiFeeDiscount>(
  companyCode: string,
  branchCode: string,
  enabled = true,
  includeInactive = false
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["fee-discounts", companyCode, branchCode, includeInactive],
    queryFn: () => {
      const params = new URLSearchParams({ companyCode });
      if (branchCode) params.set("branchCode", branchCode);
      if (includeInactive) params.set("includeInactive", "true");
      return api.get<T[]>(`/fees/discounts?${params}`);
    },
    enabled: enabled && !!companyCode,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}
