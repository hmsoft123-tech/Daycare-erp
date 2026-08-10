"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  Megaphone,
  NotebookPen,
} from "lucide-react";
import { cn } from "@kinder-pilot/ui";

const links = [
  { href: "/school", label: "Overview", icon: BookOpen, exact: true },
  { href: "/school/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/school/homework", label: "Homework", icon: NotebookPen },
  { href: "/school/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/school/progress", label: "Progress", icon: FileText },
  { href: "/school/notices", label: "Notices", icon: Megaphone },
  { href: "/school/syllabus", label: "Syllabus", icon: BookOpen },
];

export function SchoolSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {links.map((link) => {
        const active = link.exact
          ? pathname.endsWith("/school") || pathname.endsWith("/school/")
          : pathname.includes(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              active ? "bg-brand-500 text-white" : "bg-surface text-muted shadow-card"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
