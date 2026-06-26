"use client";

import { Menu, Search, Bell } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { ContextSwitcher } from "./ContextSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TopNavProps {
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNav({ breadcrumbs = [] }: TopNavProps) {
  const { setMobileSidebarOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <button
        className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {breadcrumbs.length > 0 && (
        <nav className="hidden items-center gap-1 text-sm text-gray-500 md:flex">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-gray-900" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="mx-auto hidden md:block">
        <ContextSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-lg p-2 hover:bg-gray-100" aria-label="Search">
          <Search className="h-5 w-5 text-gray-600" />
        </button>
        <button className="relative rounded-lg p-2 hover:bg-gray-100" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-600" />
          <Badge variant="danger" className="absolute -right-0.5 -top-0.5 h-5 min-w-5 px-1 text-[10px]">
            3
          </Badge>
        </button>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-brand-500 text-white text-xs">{getInitials("Admin User")}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
