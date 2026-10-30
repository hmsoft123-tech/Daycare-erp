"use client";

import type { ReactNode } from "react";
import { can, holdsCapability, type Capability } from "@/lib/rbac";
import { useTenantStore } from "@/lib/tenant-store";

/** True when the signed-in user's roles / permissions grant `capability` (see lib/rbac.ts). */
export function useCan(capability: Capability): boolean {
  const roles = useTenantStore((s) => s.roles);
  const permissions = useTenantStore((s) => s.permissions);
  return can({ roles, permissions }, capability);
}

/** True when the backend would allow it, even while the UI restrictions are switched off. */
export function useHolds(capability: Capability): boolean {
  const roles = useTenantStore((s) => s.roles);
  const permissions = useTenantStore((s) => s.permissions);
  return holdsCapability({ roles, permissions }, capability);
}

/** Bound `can()` for components that check several capabilities. */
export function useAccess(): (capability: Capability) => boolean {
  const roles = useTenantStore((s) => s.roles);
  const permissions = useTenantStore((s) => s.permissions);
  return (capability) => can({ roles, permissions }, capability);
}

/** Renders children only when the user has `capability`. */
export function Can({
  capability,
  children,
  fallback = null,
}: {
  capability: Capability;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(capability) ? <>{children}</> : <>{fallback}</>;
}
