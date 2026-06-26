import { create } from "zustand";
import type { ContextState } from "@/types";

interface UIStore extends ContextState {
  setContext: (contextId: string, contextType: "head_office" | "branch") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  contextId: "head_office",
  contextType: "head_office",
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  setContext: (contextId, contextType) => set({ contextId, contextType }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}));
