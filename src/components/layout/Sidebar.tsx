"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
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
  Clock,
  Video,
  HeartPulse,
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
    label: "Finance",
    items: [{ href: "/billing", label: "Billing & Invoices", icon: Receipt }],
  },
  {
    label: "HR & Staff",
    items: [
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
    label: "Settings",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useUIStore();

  const content = (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <div className={cn("flex h-16 items-center border-b border-white/10 px-4", sidebarCollapsed && "justify-center")}>
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">KP</div>
            <span className="font-heading text-lg font-bold">Kinder Pilot</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">KP</div>
        )}
        <button
          className="ml-auto hidden rounded-md p-1 hover:bg-brand-700 lg:block"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
        <button
          className="ml-auto rounded-md p-1 hover:bg-brand-700 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <TooltipProvider delayDuration={0}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-white/50">{group.label}</p>
              )}
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const link = (
                    <Link
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive ? "bg-brand-500 text-white" : "text-white/70 hover:bg-brand-700 hover:text-white",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
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

      <div className={cn("border-t border-white/10 p-4", sidebarCollapsed && "flex justify-center")}>
        <div className={cn("flex items-center gap-3", sidebarCollapsed && "flex-col")}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-brand-500 text-white text-xs">{getInitials("Admin User")}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">Admin User</p>
              <p className="text-xs text-white/50">Administrator</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="rounded-md p-1.5 hover:bg-brand-700" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
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
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 z-50 h-screen w-64 lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
