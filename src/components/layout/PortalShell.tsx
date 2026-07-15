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
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
        )}
      >
        <TopNav />
        <main className="animate-fade-in-up px-4 pb-10 pt-2 md:px-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
