"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TenantBranding, UserType } from "@kinder-pilot/types";
import { Permission } from "@kinder-pilot/types";
import { HEAD_OFFICE_ID } from "@/data/branches";
import { Authorities, Roles as Role } from "@/lib/rbac";

/** Roles that see every screen in the UI (API still scopes their data). */
const FULL_ACCESS_ROLES = new Set<string>([Role.SuperAdmin, Role.PlatformAdmin, Role.CompanyAdmin]);

/**
 * Legacy `<HasPermission>` keys → backend authorities. New code should use
 * `<Can capability>` / `useCan()` from components/security/Can.tsx (rules in lib/rbac.ts).
 */
const PERMISSION_ALIASES: Record<string, string[]> = {
  [Permission.AdmissionsManage]: [
    Authorities.InquiryRead,
    Authorities.InquiryCreate,
    Authorities.InquiryUpdate,
  ],
  [Permission.BillingWrite]: [Authorities.FeeLock, Authorities.PaymentConfirm],
  [Permission.StudentsRead]: [Authorities.StudentRead],
  [Permission.StudentsWrite]: [Authorities.StudentCreate, Authorities.StudentUpdate],
  [Permission.BillingRead]: [Authorities.FeeRead],
};

const ADMIN_ROLES = new Set<string>([
  Role.SuperAdmin,
  Role.PlatformAdmin,
  Role.CompanyAdmin,
  Role.BranchAdmin,
  Role.Admin,
]);
const TEACHER_ROLES = new Set<string>([Role.Teacher, Role.TempSubstituteTeacher]);

function userTypeForRoles(roles: string[]): UserType | null {
  if (roles.some((r) => ADMIN_ROLES.has(r))) return "admin";
  if (roles.some((r) => TEACHER_ROLES.has(r))) return "teacher";
  if (roles.includes(Role.Parent)) return "parent";
  return roles.length ? "staff" : null;
}

export type TenantSessionState = {
  tenantId: string | null;
  tenantSlug: string | null;
  schoolName: string | null;
  branding: TenantBranding | null;
  userType: UserType | null;
  userName: string | null;
  /** Backend roles, e.g. COMPANY_ADMIN, BRANCH_ADMIN, TEACHER */
  roles: string[];
  /** Backend permission codes, e.g. INQUIRY_READ, FEE_LOCK */
  permissions: string[];
  /** Legacy branch context — null / head_office = HQ view */
  contextId: string;
  contextType: "head_office" | "branch";
  currentBranchId: string | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;

  setTenantContext: (payload: {
    tenantId: string;
    tenantSlug: string;
    branding: TenantBranding;
  }) => void;
  setUserSession: (payload: {
    userName: string;
    roles: string[];
    permissions: string[];
  }) => void;
  clearUserSession: () => void;
  hasRole: (role: string) => boolean;
  setContext: (contextId: string, contextType: "head_office" | "branch") => void;
  setCurrentBranchId: (branchId: string | null) => void;
  hasPermission: (name: string) => boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  resetSession: () => void;
};

export const useTenantStore = create<TenantSessionState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      tenantSlug: null,
      schoolName: null,
      branding: null,
      userType: null,
      userName: null,
      roles: [],
      permissions: [],
      contextId: HEAD_OFFICE_ID,
      contextType: "head_office",
      currentBranchId: null,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

      setTenantContext: ({ tenantId, tenantSlug, branding }) =>
        set({
          tenantId,
          tenantSlug,
          branding,
          schoolName: branding.schoolName,
        }),

      setUserSession: ({ userName, roles, permissions }) =>
        set({ userName, roles, permissions, userType: userTypeForRoles(roles) }),

      clearUserSession: () =>
        set({ userName: null, roles: [], permissions: [], userType: null }),

      hasRole: (role) => get().roles.includes(role),

      setContext: (contextId, contextType) =>
        set({
          contextId,
          contextType,
          currentBranchId: contextType === "head_office" ? null : contextId,
        }),

      setCurrentBranchId: (branchId) =>
        set({
          currentBranchId: branchId,
          contextId: branchId ?? HEAD_OFFICE_ID,
          contextType: branchId ? "branch" : "head_office",
        }),

      // UI gating only — the API enforces every permission again server-side.
      hasPermission: (name) => {
        const { permissions, roles } = get();
        if (permissions.includes(name)) return true;
        if (roles.some((r) => FULL_ACCESS_ROLES.has(r))) return true;
        return (PERMISSION_ALIASES[name] ?? []).some((p) => permissions.includes(p));
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      resetSession: () =>
        set({
          tenantId: null,
          tenantSlug: null,
          schoolName: null,
          branding: null,
          currentBranchId: null,
          contextId: HEAD_OFFICE_ID,
          contextType: "head_office",
        }),
    }),
    {
      name: "kp-tenant-session",
      // UI preferences only. Identity, role and permissions must come from the API
      // on every load (GET /me) — localStorage is user-editable, so anything
      // persisted here could be tampered with to unlock screens.
      partialize: (s) => ({
        tenantSlug: s.tenantSlug,
        currentBranchId: s.currentBranchId,
        contextId: s.contextId,
        contextType: s.contextType,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);
