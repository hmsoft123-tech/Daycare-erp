"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TenantBranding, UserType } from "@kinder-pilot/types";
import { Permission } from "@kinder-pilot/types";
import { HEAD_OFFICE_ID } from "@/data/branches";

export type TenantSessionState = {
  tenantId: string | null;
  tenantSlug: string | null;
  schoolName: string | null;
  branding: TenantBranding | null;
  userType: UserType | null;
  userName: string | null;
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
    userType: UserType;
    userName: string;
    permissions: string[];
  }) => void;
  setContext: (contextId: string, contextType: "head_office" | "branch") => void;
  setCurrentBranchId: (branchId: string | null) => void;
  hasPermission: (name: string) => boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  resetSession: () => void;
};

const DEMO_PERMISSIONS = Object.values(Permission);

export const useTenantStore = create<TenantSessionState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      tenantSlug: null,
      schoolName: null,
      branding: null,
      userType: "admin",
      userName: "Admin User",
      permissions: DEMO_PERMISSIONS,
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

      setUserSession: ({ userType, userName, permissions }) =>
        set({ userType, userName, permissions }),

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

      hasPermission: (name) => get().permissions.includes(name),

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
      partialize: (s) => ({
        tenantSlug: s.tenantSlug,
        currentBranchId: s.currentBranchId,
        contextId: s.contextId,
        contextType: s.contextType,
        sidebarCollapsed: s.sidebarCollapsed,
        permissions: s.permissions,
        userType: s.userType,
        userName: s.userName,
      }),
    }
  )
);
