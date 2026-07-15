"use client";

import { QueryClient } from "@tanstack/react-query";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/** Query keys scoped by tenant + branch for precise invalidation */
export const queryKeys = {
  students: (tenantId: string, branchId: string | null) =>
    ["students", tenantId, branchId] as const,
  invoices: (tenantId: string, branchId: string | null) =>
    ["invoices", tenantId, branchId] as const,
  admissions: (tenantId: string, branchId: string | null) =>
    ["admissions", tenantId, branchId] as const,
  attendance: (tenantId: string, branchId: string | null) =>
    ["attendance", tenantId, branchId] as const,
  staff: (tenantId: string, branchId: string | null) =>
    ["staff", tenantId, branchId] as const,
};
