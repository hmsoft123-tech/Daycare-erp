"use client";

import Link from "next/link";
import { Menu, Search, Settings } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { ContextSwitcher } from "./ContextSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { getInitials } from "@/lib/utils";

interface TopNavProps {
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNav({ breadcrumbs = [] }: TopNavProps) {
  const { setMobileSidebarOpen, userName } = useUIStore();
  const displayName = userName?.trim() || "Admin User";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 bg-bg/80 px-4 backdrop-blur-md lg:px-8">
      <button
        className="rounded-full p-2 text-muted hover:bg-surface hover:shadow-card lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {breadcrumbs.length > 0 && (
        <nav className="hidden items-center gap-1 text-sm text-muted md:flex">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "font-semibold text-heading" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="mx-auto hidden md:block">
        <ContextSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          className="hidden items-center gap-2 rounded-full border border-transparent bg-surface px-3 py-2 text-sm text-muted shadow-card transition hover:border-brand-100 sm:inline-flex"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline">Search…</span>
          <kbd className="ml-2 hidden rounded bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted xl:inline">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
        <NotificationCenter />
        <Link
          href="/settings"
          className="rounded-full bg-surface p-2.5 text-muted shadow-card transition hover:text-heading"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Avatar className="ml-1 h-9 w-9 cursor-pointer ring-2 ring-surface shadow-card">
          <AvatarFallback className="bg-brand-500 text-xs font-semibold text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
