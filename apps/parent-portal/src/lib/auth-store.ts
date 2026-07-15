"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ParentSession = {
  parentName: string;
  email: string;
  phone: string;
};

type AuthState = {
  isAuthenticated: boolean;
  session: ParentSession | null;
  login: (payload: { email: string; password: string; parentName?: string }) => Promise<boolean>;
  logout: () => void;
};

const SESSION_COOKIE = "kp_parent_session";

function setSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export const useParentAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      session: null,

      login: async ({ email, password, parentName }) => {
        // Mock auth — any non-empty credentials succeed
        await new Promise((r) => setTimeout(r, 600));
        if (!email.trim() || !password.trim()) return false;

        const name =
          parentName?.trim() ||
          email.split("@")[0]?.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
          "Parent";

        setSessionCookie(true);
        set({
          isAuthenticated: true,
          session: {
            parentName: name,
            email: email.trim(),
            phone: "+92 300 1234567",
          },
        });
        return true;
      },

      logout: () => {
        setSessionCookie(false);
        set({ isAuthenticated: false, session: null });
      },
    }),
    {
      name: "kp-parent-auth",
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        session: s.session,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) setSessionCookie(true);
      },
    }
  )
);

export { SESSION_COOKIE };
