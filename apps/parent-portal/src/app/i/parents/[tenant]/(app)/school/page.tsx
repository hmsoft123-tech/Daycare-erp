import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  Megaphone,
  NotebookPen,
} from "lucide-react";
import { SchoolPageHeader } from "@/components/school/SchoolPageHeader";

const modules = [
  {
    href: "/school/attendance",
    title: "Attendance",
    desc: "Filter by year, month, or day + status",
    icon: CalendarCheck,
    color: "bg-soft-green text-[#0E9F6E]",
  },
  {
    href: "/school/homework",
    title: "Homework",
    desc: "Tonight’s tasks and due dates",
    icon: NotebookPen,
    color: "bg-brand-50 text-brand-600",
  },
  {
    href: "/school/assignments",
    title: "Assignments",
    desc: "Projects, show & tell, graded work",
    icon: ClipboardList,
    color: "bg-soft-blue text-[#4C8BF5]",
  },
  {
    href: "/school/progress",
    title: "Progress report",
    desc: "Term remarks and developmental areas",
    icon: FileText,
    color: "bg-soft-yellow text-[#B76E00]",
  },
  {
    href: "/school/notices",
    title: "Notices",
    desc: "School & class announcements",
    icon: Megaphone,
    color: "bg-soft-red text-danger",
  },
  {
    href: "/school/syllabus",
    title: "Syllabus",
    desc: "Weekly themes and learning units",
    icon: BookOpen,
    color: "bg-brand-50 text-brand-700",
  },
];

export default function SchoolHubPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <SchoolPageHeader
        title="School"
        subtitle="Live from school staff — attendance, homework, progress, notices, syllabus & assignments"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="flex gap-3 rounded-2xl bg-surface p-4 shadow-card transition hover:shadow-[0_8px_28px_rgba(31,41,51,0.1)]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-heading">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted">{m.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
