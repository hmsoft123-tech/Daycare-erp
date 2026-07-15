"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Newspaper,
  Images,
  MessageCircle,
  CreditCard,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@kinder-pilot/ui";
import { useParentAuth } from "@/lib/auth-store";

const tabs = [
  { href: "/home", label: "Feed", icon: Newspaper },
  { href: "/photos", label: "Photos", icon: Images },
  { href: "/messages", label: "Messages", icon: MessageCircle },
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

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-black/[0.04] bg-surface/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {schoolName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-heading">{schoolName}</p>
            <p className="truncate text-[11px] text-muted">
              {session?.parentName ?? "Parent"} · Family
            </p>
          </div>
          <button className="relative rounded-full p-2 text-muted hover:bg-bg" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full p-2 text-muted hover:bg-bg"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4 animate-fade-up">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-black/[0.06] bg-surface pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.endsWith(tab.href);
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
