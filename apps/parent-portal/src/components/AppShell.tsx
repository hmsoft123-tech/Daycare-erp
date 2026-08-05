"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Newspaper,
  Sparkles,
  CreditCard,
  Bell,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import { useParentAuth } from "@/lib/auth-store";

const tabs = [
  { href: "/home", label: "Feed", icon: Newspaper },
  { href: "/activity", label: "Activity", icon: Sparkles },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/billing", label: "Payments", icon: CreditCard },
];

type AppShellProps = {
  children: React.ReactNode;
  schoolName: string;
};

export function AppShell({ children, schoolName }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useParentAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.endsWith(href);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {schoolName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-heading sm:text-[15px]">{schoolName}</p>
              <p className="truncate text-[11px] text-muted sm:text-xs">
                {session?.parentName ?? "Parent"} · Family portal
              </p>
            </div>
          </div>

          <nav className="ml-4 hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
            {tabs.map((tab) => {
              const active = isActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "text-muted hover:bg-bg hover:text-heading"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="relative rounded-full p-2 text-muted hover:bg-bg"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full p-2 text-muted hover:bg-bg md:rounded-xl md:px-3 md:py-2"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden text-sm font-semibold md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 md:pb-10 lg:px-8 lg:py-8">
        <div className="animate-fade-up w-full">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-surface/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold",
                    active ? "text-brand-500" : "text-muted"
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
