"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type { ApiFeeDiscount } from "@/lib/admissions-api";

/**
 * Discounts usable at a branch. `GET /fees/discounts?branchCode=` returns only that
 * branch's rows, so company-wide ones are fetched too; a branch row replaces a
 * company-wide row with the same code.
 */
export function useFeeDiscounts<T extends ApiFeeDiscount = ApiFeeDiscount>(
  companyCode: string,
  branchCode: string,
  enabled = true,
  includeInactive = false
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["fee-discounts", companyCode, branchCode, includeInactive],
    queryFn: async () => {
      const company = new URLSearchParams({ companyCode });
      if (includeInactive) company.set("includeInactive", "true");
      const atBranch = new URLSearchParams(company);
      atBranch.set("branchCode", branchCode);
      const [shared, branch] = await Promise.all([
        api.get<T[]>(`/fees/discounts?${company}`),
        branchCode ? api.get<T[]>(`/fees/discounts?${atBranch}`) : Promise.resolve([] as T[]),
      ]);
      const byCode = new Map<string, T>();
      for (const d of [...(shared ?? []), ...(branch ?? [])]) byCode.set(d.discountCode, d);
      return [...byCode.values()];
    },
    enabled: enabled && !!companyCode,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}
