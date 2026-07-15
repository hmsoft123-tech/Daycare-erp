"use client";

import { HasPermission as BaseHasPermission } from "@kinder-pilot/ui";
import type { PermissionKey } from "@kinder-pilot/types";
import type { ReactNode } from "react";
import { useTenantStore } from "@/lib/tenant-store";

/** App-bound RBAC gate using tenant session permissions */
export function HasPermission({
  name,
  children,
  fallback = null,
}: {
  name: PermissionKey | string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasPermission = useTenantStore((s) => s.hasPermission);
  return (
    <BaseHasPermission name={name} hasPermission={hasPermission} fallback={fallback}>
      {children}
    </BaseHasPermission>
  );
}
