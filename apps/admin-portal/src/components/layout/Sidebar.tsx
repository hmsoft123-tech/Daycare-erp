"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  Receipt,
  UserCog,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  UserPlus,
  Video,
  HeartPulse,
  UsersRound,
  Palette,
  Briefcase,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Admissions",
    items: [
      { href: "/admissions", label: "Inquiries & Leads", icon: ClipboardList },
      { href: "/admissions/new", label: "Enrollment Wizard", icon: UserPlus },
    ],
  },
  {
    label: "Students",
    items: [
      { href: "/students", label: "All Students", icon: GraduationCap },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    ],
  },
  {
    label: "Family",
    items: [
      { href: "/parents", label: "Parent Management", icon: UsersRound },
    ],
  },
  {
    label: "Finance",
    items: [{ href: "/billing", label: "Billing & Invoices", icon: Receipt }],
  },
  {
    label: "HR & Staff",
    items: [
      { href: "/hr/inquiries", label: "Staff Inquiries", icon: Briefcase },
      { href: "/hr/staff", label: "Staff Directory", icon: UserCog },
      { href: "/hr/payroll", label: "Payroll", icon: Receipt },
      { href: "/hr/training", label: "Training Hub", icon: Video },
      { href: "/therapy", label: "Therapy Logs", icon: HeartPulse },
    ],
  },
  {
    label: "Inventory",
    items: [{ href: "/inventory", label: "Approval Inbox", icon: Package }],
  },
  {
    label: "Reports",
    items: [{ href: "/reports", label: "Analytics", icon: BarChart3 }],
  },
  {
    label: "Design & Layout",
    items: [{ href: "/design/theme", label: "Theme", icon: Palette }],
  },
  {
    label: "Settings",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({ schoolName }: { schoolName?: string } = {}) {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useUIStore();
  const displayName = schoolName ?? "Kinder Pilot";

  const content = (
    <div className="flex h-full flex-col border-r border-[#f1f3f5] bg-white text-heading">
      <div className={cn("flex h-[72px] items-center gap-2 px-4", sidebarCollapsed && "justify-center")}>
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-sm">
              KP
            </div>
            <div className="leading-tight">
              <span className="block font-heading text-[15px] font-bold tracking-tight truncate max-w-[160px]">
                {displayName}
              </span>
              <span className="block text-[11px] text-muted">ERP Console</span>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
            KP
          </div>
        )}
        <button
          className="ml-auto hidden rounded-full p-1.5 text-muted hover:bg-bg lg:inline-flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
        <button
          className="ml-auto rounded-full p-1.5 text-muted hover:bg-bg lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <TooltipProvider delayDuration={0}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              {!sidebarCollapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#919EAB]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
                    (item.href === "/dashboard" && pathname === "/dashboard");
                  const link = (
                    <Link
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-muted hover:bg-bg hover:text-heading",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[22px] w-[22px] shrink-0 transition-colors",
                          isActive ? "text-brand-500" : "text-[#919EAB] group-hover:text-heading"
                        )}
                      />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                  if (sidebarCollapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }
                  return <li key={item.href}>{link}</li>;
                })}
              </ul>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      <div className={cn("m-3 rounded-2xl bg-bg p-3", sidebarCollapsed && "flex justify-center p-2")}>
        <div className={cn("flex items-center gap-3", sidebarCollapsed && "flex-col")}>
          <Avatar className="h-9 w-9 ring-2 ring-white">
            <AvatarFallback className="bg-brand-500 text-xs text-white">{getInitials("Admin User")}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading">Admin User</p>
                <p className="text-xs text-muted">Administrator</p>
              </div>
              <button className="rounded-full p-1.5 text-muted hover:bg-white" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 hidden h-screen lg:block"
      >
        {content}
      </motion.aside>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#161C24]/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
