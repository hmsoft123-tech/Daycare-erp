"use client";

import type { ReactNode } from "react";
import type { PermissionKey } from "@kinder-pilot/types";

export type PermissionStoreSlice = {
  permissions: string[];
};

type HasPermissionProps = {
  name: PermissionKey | string;
  children: ReactNode;
  fallback?: ReactNode;
  /** Injected getter — apps pass Zustand selector to keep package framework-light */
  hasPermission: (name: string) => boolean;
};

/**
 * Declarative RBAC gate — renders children only when permission is present.
 * Usage:
 *   <HasPermission name="billing.write" hasPermission={useTenantStore.getState().hasPermission}>
 *     <CreateInvoiceButton />
 *   </HasPermission>
 */
export function HasPermission({
  name,
  children,
  fallback = null,
  hasPermission,
}: HasPermissionProps) {
  if (!hasPermission(name)) return <>{fallback}</>;
  return <>{children}</>;
}
