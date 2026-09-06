"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Baby,
  MessageSquare,
  CreditCard,
  CalendarDays,
  FileText,
  Images,
  LifeBuoy,
  UsersRound,
  Settings,
  Bell,
  LogOut,
  MoreHorizontal,
  School,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useParentAuth } from "@/lib/auth-store";

const primaryTabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/children", label: "Children", icon: Baby },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/billing", label: "Fees", icon: CreditCard },
] as const;

const moreLinks = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/requests", label: "Requests", icon: LifeBuoy },
  { href: "/family", label: "Family", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/school", label: "School records", icon: School },
  { href: "/activity", label: "Activity", icon: Sparkles },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  schoolName: string;
};

export function AppShell({ children, schoolName }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useParentAuth();
  const [desktopMore, setDesktopMore] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/home") return /\/home\/?$/.test(pathname);
    if (href === "/children") return pathname.includes("/children");
    if (href === "/school") return pathname.includes("/school");
    if (href === "/billing") return pathname.includes("/billing");
    if (href === "/activity") return pathname.includes("/activity");
    return pathname.includes(href);
  };

  const moreActive = moreLinks.some((l) => isActive(l.href));

  useEffect(() => {
    setDesktopMore(false);
    setMobileMore(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopMore) return;
    const onPointer = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setDesktopMore(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopMore(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopMore]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
          <Link
            href="/home"
            className="flex min-w-0 max-w-[10rem] shrink-0 items-center gap-2.5 sm:max-w-[13rem]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white sm:h-10 sm:w-10">
              {schoolName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-heading">{schoolName}</p>
              <p className="truncate text-[11px] leading-tight text-muted">
                {session?.parentName ?? "Parent"}
              </p>
            </div>
          </Link>

          <nav className="ml-1 hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
            {primaryTabs.map((tab) => {
              const active = isActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-semibold transition lg:px-3",
                    active ? "bg-brand-50 text-brand-600" : "text-muted hover:bg-bg hover:text-heading"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.label}
                </Link>
              );
            })}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setDesktopMore((o) => !o)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-semibold transition lg:px-3",
                  moreActive || desktopMore
                    ? "bg-brand-50 text-brand-600"
                    : "text-muted hover:bg-bg hover:text-heading"
                )}
                aria-expanded={desktopMore}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="h-4 w-4 shrink-0" />
                More
              </button>

              {desktopMore && (
                <div
                  role="menu"
                  className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-80 -translate-x-1/2 rounded-2xl border border-black/[0.06] bg-surface p-2 shadow-[0_12px_40px_rgba(31,41,51,0.14)]"
                >
                  <ul className="grid grid-cols-2 gap-1">
                    {moreLinks.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            role="menuitem"
                            onClick={() => setDesktopMore(false)}
                            className={cn(
                              "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold",
                              active ? "bg-brand-50 text-brand-600" : "text-heading hover:bg-bg"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center">
            <ThemeToggle />
            <Link
              href="/messages"
              className="relative rounded-full p-2 text-muted hover:bg-bg"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface" />
            </Link>
            <Link
              href="/settings"
              className="hidden rounded-full p-2 text-muted hover:bg-bg sm:inline-flex"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full p-2 text-muted hover:bg-bg"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 md:pb-10 lg:px-8 lg:py-8">
        <div className="animate-fade-up w-full">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-surface/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-0.5">
          {primaryTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 whitespace-nowrap px-0.5 py-2 text-[10px] font-semibold",
                    active ? "text-brand-500" : "text-muted"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileMore(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 whitespace-nowrap px-0.5 py-2 text-[10px] font-semibold",
                moreActive || mobileMore ? "text-brand-500" : "text-muted"
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.4 : 1.9} />
              More
            </button>
          </li>
        </ul>
      </nav>

      {mobileMore && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileMore(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-heading">More</p>
              <button type="button" onClick={() => setMobileMore(false)} className="rounded-full p-2 text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMore(false)}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-3 text-sm font-semibold",
                        isActive(item.href) ? "bg-brand-50 text-brand-600" : "bg-bg text-heading"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
