"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import type { TenantBranding } from "@kinder-pilot/types";
import { createAppQueryClient } from "@/lib/query-client";
import { useTenantStore } from "@/lib/tenant-store";

function BranchInvalidator({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const branchId = useTenantStore((s) => s.currentBranchId);
  const tenantId = useTenantStore((s) => s.tenantId);
  const prev = useRef(branchId);

  useEffect(() => {
    if (prev.current !== branchId) {
      prev.current = branchId;
      // Branch switch → wipe cached tables and refetch branch-scoped data
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey;
          return Array.isArray(key) && key.includes(tenantId);
        },
      });
      void queryClient.refetchQueries({ type: "active" });
    }
  }, [branchId, tenantId, queryClient]);

  return <>{children}</>;
}

export function AppProviders({
  children,
  tenantSlug,
  tenantId,
  branding,
}: {
  children: ReactNode;
  tenantSlug: string;
  tenantId: string;
  branding: TenantBranding;
}) {
  const [client] = useState(() => createAppQueryClient());
  const setTenantContext = useTenantStore((s) => s.setTenantContext);

  useEffect(() => {
    setTenantContext({ tenantId, tenantSlug, branding });
  }, [tenantId, tenantSlug, branding, setTenantContext]);

  return (
    <QueryClientProvider client={client}>
      <BranchInvalidator>{children}</BranchInvalidator>
    </QueryClientProvider>
  );
}
