"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <TopNav />
        <main className="p-4 md:p-6 animate-fade-in-up">{children}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
